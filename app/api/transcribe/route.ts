export const runtime="nodejs";
export async function POST(request:Request){
  try{
    const form=await request.formData(),audio=form.get("audio");
    if(!(audio instanceof File)||audio.size<100)return Response.json({error:"음성 파일을 확인할 수 없습니다."},{status:400});
    if(audio.size>25*1024*1024)return Response.json({error:"녹음은 25MB 이하만 변환할 수 있습니다."},{status:413});
    const key=process.env.OPENAI_API_KEY||process.env.AI_API_KEY;
    if(!key)return Response.json({error:"음성 변환 설정이 필요합니다."},{status:503});
    const field=form.get("field")==="title"?"제목":"본문",context=String(form.get("context")||"").replace(/[\u0000-\u001f]/g," ").slice(-800),category=String(form.get("category")||"").replace(/[^가-힣a-zA-Z0-9 ]/g,"").slice(0,20);
    const prompt=[`익명 커뮤니티 진주의 ${category||"일반"} 게시판 ${field}을 한국어로 받아씁니다.`,`말한 내용을 요약하거나 새 내용을 보태지 말고, 들린 표현을 그대로 정확히 적습니다. 자연스러운 한국어 띄어쓰기와 문장부호를 사용합니다.`,context?`앞서 작성한 문맥: ${context}`:""] .filter(Boolean).join("\n");
    const body=new FormData();
    body.append("file",audio,audio.name||"jinju-voice.webm");
    body.append("model",process.env.AI_TRANSCRIBE_MODEL||"gpt-4o-transcribe");
    body.append("language","ko");
    body.append("prompt",prompt);
    body.append("response_format","json");
    body.append("temperature","0");
    const response=await fetch(process.env.AI_TRANSCRIBE_ENDPOINT||"https://api.openai.com/v1/audio/transcriptions",{method:"POST",headers:{authorization:`Bearer ${key}`},body,signal:AbortSignal.timeout(22_000)}),data=await response.json() as {text?:string;error?:{message?:string}};
    if(!response.ok||!data.text)return Response.json({error:data.error?.message||"음성을 글로 바꾸지 못했습니다."},{status:502});
    return Response.json({text:data.text.trim().slice(0,2000)},{headers:{"cache-control":"no-store"}});
  }catch(error){
    if(error instanceof DOMException&&error.name==="TimeoutError")return Response.json({error:"음성 확인이 지연되고 있습니다."},{status:504});
    return Response.json({error:"음성 입력을 처리할 수 없습니다."},{status:400});
  }
}
