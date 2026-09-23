package za.ac.univen.clone;
class ApiProblem extends RuntimeException {
 final int status;final String code;
 ApiProblem(int status,String code,String message){super(message);this.status=status;this.code=code;}
 static ApiProblem expired(){return new ApiProblem(401,"SESSION_EXPIRED","The portal could not verify your session. Sign in with your current credentials.");}
 static ApiProblem changed(){return new ApiProblem(502,"PAGE_CHANGED","The portal page could not be verified. Please try again later.");}
}
