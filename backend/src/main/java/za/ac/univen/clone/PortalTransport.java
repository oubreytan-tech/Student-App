package za.ac.univen.clone;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.stereotype.Component;

@Component
class PortalTransport {
 static final URI BASE=URI.create("https://univenierp01.univen.ac.za/pls/prodi41/");
 private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
 record Reply(int status,byte[] bytes,String contentType,List<String> cookies){String html(){return new String(bytes,StandardCharsets.UTF_8);}}
 static URI allowed(String path){URI uri=BASE.resolve(path);if(!"https".equals(uri.getScheme())||!BASE.getHost().equals(uri.getHost())||uri.getPort()!=-1||uri.getUserInfo()!=null||!uri.getPath().startsWith(BASE.getPath()))throw new ApiProblem(403,"ACCESS_DENIED","The portal destination was not allowed.");return uri;}
 Reply request(String path,String cookies,String body){
  var builder=HttpRequest.newBuilder(allowed(path)).timeout(Duration.ofSeconds(20)).header("Referer",BASE+"w99pkg.mi_login");if(!cookies.isEmpty())builder.header("Cookie",cookies);
  if(body!=null)builder.header("Content-Type","application/x-www-form-urlencoded").POST(HttpRequest.BodyPublishers.ofString(body));else builder.GET();
  try{var response=client.send(builder.build(),HttpResponse.BodyHandlers.ofByteArray());if(response.body().length>8*1024*1024)throw ApiProblem.changed();return new Reply(response.statusCode(),response.body(),response.headers().firstValue("content-type").orElse(""),response.headers().allValues("set-cookie"));}
  catch(ApiProblem e){throw e;}catch(InterruptedException e){Thread.currentThread().interrupt();throw new ApiProblem(502,"TIMEOUT","The portal request was interrupted.");}catch(Exception e){throw new ApiProblem(502,"TIMEOUT","The university portal did not respond in time.");}
 }
}
