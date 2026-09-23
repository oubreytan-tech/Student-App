package za.ac.univen.clone;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@Configuration
class WebSecurity {
 @Bean UserDetailsService users(){return new InMemoryUserDetailsManager();}
 @Bean SecurityFilterChain security(HttpSecurity http)throws Exception{return http.csrf(AbstractHttpConfigurer::disable).formLogin(AbstractHttpConfigurer::disable).httpBasic(AbstractHttpConfigurer::disable).logout(AbstractHttpConfigurer::disable).authorizeHttpRequests(r->r.requestMatchers("/api/**","/actuator/health","/actuator/health/**").permitAll().anyRequest().denyAll()).build();}
}
@Component
class RequestBoundary extends OncePerRequestFilter {
 @Value("${app.origin}") String origin;
 protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  String reference=UUID.randomUUID().toString();request.setAttribute("reference",reference);response.setHeader("X-Request-ID",reference);response.setHeader("Cache-Control","no-store");
  if(!java.util.Set.of("GET","HEAD","OPTIONS").contains(request.getMethod())){
   String actual=request.getHeader("Origin");
   if(!origin.equals(actual)||"cross-site".equals(request.getHeader("Sec-Fetch-Site"))){response.setStatus(403);response.setContentType("application/json");response.getWriter().write("{\"error\":\"Request origin is not allowed.\"}");return;}
   if(request.getContentType()==null||!request.getContentType().startsWith("application/json")){response.sendError(415);return;}
  }
  if(request.getContentLengthLong()>3*1024*1024){response.sendError(413);return;}
  chain.doFilter(request,response);
 }
}
@RestControllerAdvice
class Errors {
 private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(Errors.class);
 @ExceptionHandler(ApiProblem.class) ResponseEntity<?> known(ApiProblem error,HttpServletRequest request){
  if(error.status==401&&request.getRequestURI().startsWith("/api/scrape/")){var session=request.getSession(false);if(session!=null)session.removeAttribute("portal");}
  String reference=Data.str(request.getAttribute("reference"));
  LOG.warn("request_failed category={} reference={}",error.code,reference);
  Object detail=request.getRequestURI().startsWith("/api/scrape/read/")?Data.map("code",error.code,"message",error.getMessage()):error.getMessage();
  return ResponseEntity.status(error.status).body(Data.map("success",false,"status","error","data",null,"academicYear",null,"retrievedAt",java.time.Instant.now().toString(),"warnings",java.util.List.of(),"error",detail,"reference",reference));
 }
 @ExceptionHandler(Exception.class) ResponseEntity<?> unknown(Exception error,HttpServletRequest request){return known(new ApiProblem(500,"INTERNAL_ERROR","The request could not be completed. Reference: "+request.getAttribute("reference")),request);}
}
