package za.ac.univen.clone;
import jakarta.servlet.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.util.*;

@RestController
@RequestMapping("/api/scrape")
class PortalController {
 private final PortalTransport transport;private final AccountService accounts;
 PortalController(PortalTransport transport,AccountService accounts){this.transport=transport;this.accounts=accounts;}
 static PortalSession session(HttpServletRequest request){var session=request.getSession(false);Object value=session==null?null:session.getAttribute("portal");if(!(value instanceof PortalSession portal))throw ApiProblem.expired();return portal;}
 @PostMapping("/portal-sync") Map<String,Object> login(@RequestBody Map<String,Object> body,HttpServletRequest request){String number=Data.text(body,"unum"),pin=Data.text(body,"pin");if(!number.matches("\\d{7,9}")||!pin.matches("[1-9]\\d{4}")||(!Data.text(body,"numtype").isEmpty()&&!Data.text(body,"numtype").equals("S")))throw new ApiProblem(400,"INVALID_INPUT","Enter a valid student number and five-digit PIN.");var session=request.getSession(true);if(session.getAttribute("portal") instanceof PortalSession previous)previous.revoke();session.removeAttribute("portal");var portal=new PortalSession(number,transport);var data=portal.login(pin);request.changeSessionId();session.setAttribute("portal",portal);return Data.map("success",true,"isLive",true,"statusMessage","Portal session verified. Additional sections may be unavailable.","data",data);}
 @PostMapping("/logout") Map<String,Object> logout(HttpServletRequest request){var session=request.getSession(false);if(session!=null){if(session.getAttribute("portal") instanceof PortalSession portal)portal.revoke();session.removeAttribute("portal");}return Data.map("success",true);}
 @PostMapping("/keep-alive") Map<String,Object> keepAlive(HttpServletRequest request){session(request).verify();return Data.map("success",true);}
 @PostMapping("/link-account") Map<String,Object> link(HttpServletRequest request){var portal=session(request);portal.verify();accounts.linkStudent(request,portal.studentNumber);return Data.map("success",true);}
 @GetMapping("/read/{section}") Map<String,Object> read(@PathVariable String section,HttpServletRequest request){if(request.getParameter("unum")!=null||request.getParameter("pin")!=null)throw new ApiProblem(400,"INVALID_INPUT","Use your signed-in session.");return session(request).read(section);}
 @GetMapping("/proof-status") Map<String,Object> proofStatus(HttpServletRequest request){session(request).academicProof();return Data.map("success",true,"isLive",true,"streamUrl","/api/scrape/proof-pdf");}
 @GetMapping("/proof-pdf") ResponseEntity<byte[]> proof(HttpServletRequest request,@RequestParam(defaultValue="0") String download){return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header("Content-Disposition",(download.equals("1")?"attachment":"inline")+"; filename=\"proof-of-registration.pdf\"").body(session(request).academicProof());}
 @GetMapping("/residence-proof-pdf") ResponseEntity<byte[]> residence(HttpServletRequest request){return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).header("Content-Disposition","attachment; filename=\"residence-proof.pdf\"").body(session(request).residenceProof());}
}
