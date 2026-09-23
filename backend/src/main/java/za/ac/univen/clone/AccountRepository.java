package za.ac.univen.clone;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.security.SecureRandom;
import java.util.*;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
class AccountRepository {
 private final JdbcTemplate jdbc;private final byte[] key;
 AccountRepository(JdbcTemplate jdbc,@Value("${app.account-key}")String value){this.jdbc=jdbc;try{key=value.isBlank()?new byte[0]:Base64.getDecoder().decode(value);if(key.length!=0&&key.length!=32)throw new IllegalArgumentException();}catch(Exception e){throw new IllegalArgumentException("APP_ACCOUNT_KEY must be a base64 encoded 32-byte key.");}}
 boolean configured(){return key.length==32;}
 private String encrypt(String data){try{byte[] iv=new byte[12];new SecureRandom().nextBytes(iv);var cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));return Base64.getEncoder().encodeToString(iv)+":"+Base64.getEncoder().encodeToString(cipher.doFinal(data.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException("Account encryption failed");}}
 private String decrypt(String data){try{String[] pieces=data.split(":",2);var cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Base64.getDecoder().decode(pieces[0])));return new String(cipher.doFinal(Base64.getDecoder().decode(pieces[1])),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException("Account decryption failed");}}
 Map<String,Object> get(String id){if(id.isBlank()||!configured())return null;var rows=jdbc.queryForList("SELECT payload FROM app_account WHERE id=?",String.class,id);return rows.isEmpty()?null:Data.parse(decrypt(rows.getFirst()));}
 void save(Map<String,Object> account){jdbc.update("UPDATE app_account SET payload=? WHERE id=?",encrypt(Data.json(account)),Data.text(account,"id"));}
 @Transactional synchronized Map<String,Object> authenticate(Map<String,Object> identity,String linkTo){String provider=Data.text(identity,"provider"),subject=Data.text(identity,"subject");var owners=jdbc.queryForList("SELECT account_id FROM app_identity WHERE provider=? AND subject=?",String.class,provider,subject);String owner=owners.isEmpty()?"":owners.getFirst();if(!linkTo.isBlank()&&!owner.isBlank()&&!owner.equals(linkTo))throw new ApiProblem(409,"ACCOUNT_CONFLICT","This sign-in belongs to another app account.");Map<String,Object> account=get(linkTo.isBlank()?owner:linkTo);if(!linkTo.isBlank()&&account==null)throw new ApiProblem(401,"SESSION_EXPIRED","Sign in again before linking an account.");if(account==null){account=Data.map("id",UUID.randomUUID().toString(),"name",identity.get("name"),"email",identity.get("email"),"identities",new ArrayList<Map<String,Object>>(),"calls",new ArrayList<Map<String,Object>>());jdbc.update("INSERT INTO app_account(id,payload) VALUES(?,?)",account.get("id"),encrypt(Data.json(account)));}var identities=Data.list(account.get("identities"));var previous=identities.stream().filter(i->provider.equals(i.get("provider"))).findFirst();if(previous.isPresent()){if(!subject.equals(previous.get().get("subject")))throw new ApiProblem(409,"ACCOUNT_CONFLICT","A different mailbox from this provider is already linked.");String refresh=Data.text(previous.get(),"refreshToken");previous.get().putAll(identity);if(Data.text(previous.get(),"refreshToken").isBlank())previous.get().put("refreshToken",refresh);}else identities.add(identity);if(owner.isEmpty())jdbc.update("INSERT INTO app_identity(provider,subject,account_id) VALUES(?,?,?)",provider,subject,account.get("id"));save(account);return account;}
 @Transactional synchronized void link(String id,String number){var account=get(id);if(account==null)throw new ApiProblem(401,"SESSION_EXPIRED","Sign in to your support account first.");String old=Data.text(account,"studentNumber");if(old.equals(number))return;if(!old.isBlank()||!jdbc.queryForList("SELECT account_id FROM student_link WHERE student_number=?",String.class,number).isEmpty())throw new ApiProblem(409,"ACCOUNT_CONFLICT","This student number or account is already linked elsewhere.");jdbc.update("INSERT INTO student_link(student_number,account_id) VALUES(?,?)",number,id);account.put("studentNumber",number);save(account);}
}
