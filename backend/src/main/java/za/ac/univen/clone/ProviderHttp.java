package za.ac.univen.clone;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
class ProviderHttp {
 private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(ProviderHttp.class);
 private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
 static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
 static String form(Map<String,?> values){return String.join("&",values.entrySet().stream().map(e->encode(e.getKey())+"="+encode(Data.str(e.getValue()))).toList());}
 Map<String,Object> formPost(String url,Map<String,?> body){return send(url,"POST",null,form(body),"application/x-www-form-urlencoded");}
 Map<String,Object> request(String url,String method,String token,Object body){return send(url,method,token,body==null?null:Data.json(body),"application/json");}
 private Map<String,Object> send(String url,String method,String token,String body,String contentType){URI uri=URI.create(url);if(!uri.getScheme().equals("https")||!Set.of("accounts.google.com","oauth2.googleapis.com","gmail.googleapis.com","graph.microsoft.com","login.microsoftonline.com").contains(uri.getHost())||uri.getUserInfo()!=null||uri.getPort()!=-1)throw new ApiProblem(502,"PROVIDER_ERROR","Provider destination is not allowed.");var builder=HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(25)).header("Accept","application/json");if(token!=null)builder.header("Authorization","Bearer "+token);if(body!=null)builder.header("Content-Type",contentType);builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(body));try{var response=client.send(builder.build(),HttpResponse.BodyHandlers.ofString());if(response.body().length()>12*1024*1024)throw new ApiProblem(502,"PROVIDER_ERROR","The provider response was too large.");if(response.statusCode()<200||response.statusCode()>=300){LOG.warn("provider_request_failed host={} path={} status={}",uri.getHost(),uri.getPath(),response.statusCode());throw new ApiProblem(502,"PROVIDER_ERROR","The email provider could not complete the request. Reconnect your account if permissions have expired.");}return response.body().isBlank()?Data.map():Data.parse(response.body());}catch(ApiProblem e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiProblem(502,"PROVIDER_TIMEOUT","Email delivery could not be confirmed. Refresh before trying again.");}catch(Exception e){throw new ApiProblem(502,"PROVIDER_TIMEOUT","Email delivery could not be confirmed. Refresh before trying again.");}}
}
