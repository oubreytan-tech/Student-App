package za.ac.univen.clone;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import java.net.*;
import java.net.http.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.datasource.url=jdbc:h2:mem:boundary;DB_CLOSE_DELAY=-1","app.origin=http://localhost:4200"})
class BoundaryTest {
 @LocalServerPort int port;
 HttpResponse<String> request(String path,String body,String origin)throws Exception {var builder=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+path));if(origin!=null)builder.header("Origin",origin);if(body!=null)builder.header("Content-Type","application/json").POST(HttpRequest.BodyPublishers.ofString(body));return HttpClient.newHttpClient().send(builder.build(),HttpResponse.BodyHandlers.ofString());}
 @Test void healthContainsNoPrivateDetails()throws Exception {var response=request("/actuator/health",null,null);assertEquals(200,response.statusCode());assertFalse(response.body().contains("components"));}
 @Test void studentsCannotReadWithoutSession()throws Exception {var response=request("/api/scrape/read/results",null,null);assertEquals(401,response.statusCode());assertTrue(response.headers().firstValue("X-Request-ID").isPresent());assertFalse(response.body().contains("stackTrace"));}
 @Test void crossOriginLoginBlocked()throws Exception {assertEquals(403,request("/api/scrape/portal-sync","{}","https://evil.example").statusCode());}
 @Test void invalidPinDoesNotContactPortal()throws Exception {assertEquals(400,request("/api/scrape/portal-sync","{\"unum\":\"20000001\",\"pin\":\"01234\"}","http://localhost:4200").statusCode());}
 @Test void supportHistoryRequiresAccount()throws Exception {assertEquals(401,request("/api/account/tickets/refresh","{}","http://localhost:4200").statusCode());}
 @Test void accountConfigExposesNoSecrets()throws Exception {var response=request("/api/account/session",null,null);assertEquals(200,response.statusCode());assertTrue(response.body().contains("configured"));assertFalse(response.body().contains("accessToken"));}
 @Test void managementEnvironmentNotExposed()throws Exception {assertEquals(403,request("/actuator/env",null,null).statusCode());}
 @Test void examAdmissionRequiresSession()throws Exception {assertEquals(401,request("/api/scrape/exam-admission-pdf",null,null).statusCode());}
}
