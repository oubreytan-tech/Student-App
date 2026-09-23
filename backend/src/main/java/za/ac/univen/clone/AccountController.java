package za.ac.univen.clone;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/account")
class AccountController {
 private static final Logger LOG=LoggerFactory.getLogger(AccountController.class);
 private final AccountService accounts;private final MailService mail;
 AccountController(AccountService accounts,MailService mail){this.accounts=accounts;this.mail=mail;}
 @GetMapping("/session") Map<String,Object> session(HttpServletRequest request){return Data.map("account",accounts.summary(accounts.account(request)),"configured",Data.map("google",accounts.configured("google"),"microsoft",accounts.configured("microsoft")));}
 @PostMapping("/start") Map<String,Object> start(@RequestBody Map<String,Object> body,HttpServletRequest request){return Data.map("url",accounts.start(request,Data.text(body,"provider"),Boolean.TRUE.equals(body.get("link"))));}
 @GetMapping("/callback") ResponseEntity<String> callback(@RequestParam(defaultValue="")String state,@RequestParam(defaultValue="")String code,HttpServletRequest request){boolean success=true;try{accounts.callback(request,state,code);}catch(Exception e){success=false;LOG.warn("oauth_callback_failed reference={} type={} message={}",request.getAttribute("reference"),e.getClass().getSimpleName(),e.getMessage());}String nonce=AccountService.random();String event=success?"univen-account-connected":"univen-account-error";String text=success?"Signed in successfully. You can return to the app.":"Sign-in could not be completed. Close this window and try again.";return ResponseEntity.status(success?200:400).contentType(MediaType.TEXT_HTML).header("Content-Security-Policy","default-src 'none'; script-src 'nonce-"+nonce+"'; base-uri 'none'; frame-ancestors 'none'").body("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>UNIVEN sign-in</title><p>"+text+"</p><script nonce=\""+nonce+"\">if(window.opener){window.opener.postMessage({type:'"+event+"'},"+Data.json(accounts.origin()).replace("<","\\u003c")+");}setTimeout(()=>window.close(),1000);</script></html>");}
 @PostMapping("/logout") Map<String,Object> logout(HttpServletRequest request){var session=request.getSession(false);if(session!=null){session.removeAttribute("account");session.removeAttribute("oauth");request.changeSessionId();}return Data.map("success",true);}
 @PostMapping("/tickets/refresh") Map<String,Object> refresh(HttpServletRequest request){return mail.refresh(accounts.require(request));}
 @PostMapping("/tickets/send") Map<String,Object> send(@RequestBody Map<String,Object> body,HttpServletRequest request){return Data.map("ticket",mail.send(accounts.require(request),body));}
 @PostMapping("/tickets/reply") Map<String,Object> reply(@RequestBody Map<String,Object> body,HttpServletRequest request){return Data.map("ticket",mail.reply(accounts.require(request),body));}
}
