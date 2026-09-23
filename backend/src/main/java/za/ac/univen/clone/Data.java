package za.ac.univen.clone;
import java.util.*;
import java.util.regex.*;
import com.fasterxml.jackson.databind.ObjectMapper;
final class Data {
 static final ObjectMapper JSON=new ObjectMapper();
 static Map<String,Object> map(Object... pairs){var result=new LinkedHashMap<String,Object>();for(int i=0;i<pairs.length;i+=2)result.put(pairs[i].toString(),pairs[i+1]);return result;}
 @SuppressWarnings("unchecked") static Map<String,Object> obj(Object value){return value instanceof Map?(Map<String,Object>)value:new LinkedHashMap<>();}
 @SuppressWarnings("unchecked") static List<Map<String,Object>> list(Object value){return value instanceof List?(List<Map<String,Object>>)value:new ArrayList<>();}
 static String str(Object value){return value==null?"":value.toString();}
 static String text(Map<String,Object> value,String key){return str(value.get(key));}
 static String match(String regex,String value){var m=Pattern.compile(regex,Pattern.CASE_INSENSITIVE|Pattern.DOTALL).matcher(value);return m.find()?m.group(1):"";}
 static String json(Object value){try{return JSON.writeValueAsString(value);}catch(Exception e){throw new IllegalStateException("JSON encoding failed");}}
 static Map<String,Object> parse(String value){try{return obj(JSON.readValue(value,Map.class));}catch(Exception e){throw new ApiProblem(502,"PARSE_FAILED","The service response could not be read.");}}
 static double number(String value){String s=value.replaceAll("[R\\s]","");if(s.contains(",")&&s.contains(".")){s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(".","").replace(',','.'):s.replace(",","");}else{s=s.replace(',','.');}try{return Double.parseDouble(s);}catch(Exception e){return 0;}}
}
