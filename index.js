let pointer={
    isdown:false,
    x:0,
    y:0,
    dx:0,
    dy:0,
    vx:0,
    vy:0,
    ctx:{oldX:0,oldY:0,oldT:0,wasDown:false}
};
window.addEventListener("pointerdown",(e)=>{
    pointer.isdown=true;
});
window.addEventListener("pointerup",(e)=>{
    pointer.isdown=false;
});
window.addEventListener("touchend",(e)=>{
    pointer.isdown=false;
});
window.addEventListener("pointermove",(e)=>{
    pointer.x=e.clientX;
    pointer.y=e.clientY;
    pointer.dx=pointer.x-pointer.ctx.oldX;
    pointer.dy=pointer.y-pointer.ctx.oldY;
    let dt=(performance.now()-pointer.ctx.oldT)/1000;
    pointer.vx=pointer.dx/dt;
    pointer.vy=pointer.dy/dt;
    pointer.ctx.oldT=performance.now();
});




class Item{
    constructor(name,isFile,index,parent){
        this.index=index;
        this.isFile=isFile;
        this.CT=0;
        this.name=name;
        this.parent=parent;
        this.prog_time=0;
        //this.fullTime;
        const div=document.createElement("div");
        div.onclick=this.isFile?()=>{this.playFile();this.updateCtx()}:()=>this.playDir();
        //let button;
        console.log(this.isFile);
        const p=document.createElement("p");
        p.innerHTML=this.name;
        const upperdiv=document.createElement("div");
        const bottomdiv=document.createElement("div");
        // if(this.isFile){
            div.className="item_div elem";
            upperdiv.className="item_upperdiv elem";
            bottomdiv.className="item_bottomdiv elem";
            let button=document.createElement("button");
            button.innerText=this.isFile?"🎵":"📁";
            button.style.fontSize="1.5rem";
        // }else{
        //     button=document.createElement("div");
        //     button.innerText="📁";
        //     button.style.fontSize="2rem";
        //     button.className="icon_div";
        //     div.className="item_div_dir"
        // }
        this.parent.appendChild(div);
        div.appendChild(upperdiv);
        div.appendChild(bottomdiv);
        upperdiv.appendChild(button);
        upperdiv.appendChild(p);

        
    }
    playFile(){
        const audio=document.getElementById("audio");
        audio.src=`${join("mfmusic",bar.ctx.currentDir,this.name)}`;
        console.log(`${join("mfmusic",bar.ctx.currentDir,this.name)}`);
        audio.oncanplaythrough = () => {
        audio.play().catch(e => console.error("Playback failed:", e));
        };
        bar.ctx.index=this.index;
        bar.reset(this.name);
    }
    async playDir(){
        if(!isLoading){
            isLoading=true
            const newDir=join(currentDir,this.name);
            try{
                const data=await getDir(newDir);
                currentDir=newDir;
                init(data);
            }catch(err){
                console.log(err);
            }finally{
                isLoading=false;
            }
        }
    }
    updateCtx(){
        bar.ctx.items=items;
        bar.ctx.currentDir=currentDir;
    }
}

class Bar{
    constructor(){
        this.name="";
        this.pauseButton=document.createElement("button");
        //this.pauseButton.onclick=()=>{this.handlePauseAndPlay()};
        this.pauseButton.className="pauseButton"
        this.audio=document.getElementById("audio");
        this.div=document.createElement("div");
        this.time=document.createElement("p");
        this.Textname=document.createElement("p");
        this.time.innerText="0:00";
        this.Textname.innerText=this.name;
        
        this.div.className="playprogressDiv elem";
        this.upperDiv=document.createElement("div");
        this.upperDiv.className="upperDiv elem";
        this.progressbar=document.createElement("div");
        this.progressbar.className="progressbar";
        this.progressCircle=document.createElement("div");
        this.progressCircle.className="progressCircle";
        document.getElementById("Bottom").appendChild(this.pauseButton);
        document.getElementById("Bottom").appendChild(this.div);
        //this.upperDiv.appendChild(this.pauseButton);
        this.upperDiv.appendChild(this.Textname);
        this.upperDiv.appendChild(this.time);
        this.div.appendChild(this.upperDiv);
        this.div.appendChild(this.progressbar);
        this.progressbar.appendChild(this.progressCircle);
        this.ctx={index:null,buttonHasBeenPressed:false,items:undefined,currentDir:undefined,audioPuased:false};//TODO use audio paused
    }
    reset(name){
        this.name=name;
        this.pos=0;
        this.progressCircle.style.left="0%";
    }
    handlePauseAndPlay(){
        if(this.audio.paused){
            this.audio.play();
            return;
        }
        this.audio.pause();
    }
    
    update(){
        {
            this.progressbar.style.top=`50%`;
            this.progressbar.style.left=`50%`;
            this.progressbar.style.transform=`translate(-50%,-50%)`;
            this.Textname.innerText=this.name;
        }
        {
            this.current_time=this.audio.currentTime;
            const progress=(this.audio.currentTime/this.audio.duration)*100;
            this.progressCircle.style.left=`${progress?progress:0}%`;
            this.time.innerText=`${Math.floor(this.audio.currentTime/60)}:${Math.floor(this.audio.currentTime%60).toString().padStart(2,'0')}`;
        }

        if(pointer.isdown){//
            {
                const rec=this.div.getBoundingClientRect();
                const proRec=this.progressbar.getBoundingClientRect()
                if(Math.abs(proRec.top-pointer.y)<Math.abs(proRec.top-rec.top)/2){
                    pointer.wasDown=true;
                    let X=Math.max(proRec.left,Math.min(proRec.right,pointer.x))-proRec.left;
                    this.CT=(X/(proRec.right-proRec.left))*this.audio.duration;
                    const progress=((pointer.x-proRec.left)/(proRec.width))*100;
                    this.progressCircle.style.left=`${progress}%`;
                    this.audio.pause();
                }
            }
            {
                const rec=this.pauseButton.getBoundingClientRect();
                const center={x:(rec.left+rec.right)/2,y:(rec.top+rec.bottom)/2};
                if((center.x-pointer.x)**2+(center.y-pointer.y)**2<=(rec.width/2)**2&&!this.ctx.buttonHasBeenPressed){
                    this.handlePauseAndPlay();
                    this.ctx.buttonHasBeenPressed=true;
                }
                
            }

        }//
        else if(pointer.wasDown){
                if(this.CT||this.CT===0){this.audio.currentTime=this.CT;}
                pointer.wasDown=false;
            }
        else{
            this.ctx.buttonHasBeenPressed=false;
        }
        if(this.audio.currentTime>=this.audio.duration&&this.ctx.index<items.length){
            const oldIndex=this.ctx.index;
            this.ctx.index=Math.min(items.length-1,this.ctx.index+1);
            for(;;){
                if(items[this.ctx.index]?.isFile){
                    items[this.ctx.index].playFile();
                    break;
                }else if(this.ctx.index>=items.length){
                    this.ctx.index=oldIndex;
                    break;
                }
                else this.ctx.index++;
            }
        }


        requestAnimationFrame(this.update.bind(this));
    }
    
}
class sitting{
    constructor(parent,type,initval){
        this.val=initval;
        this.type,type;
        this.parent=parent;
        const div=document.createElement("div");
        //div.onclick=this.isFile?()=>{this.playFile();this.updateCtx()}:()=>this.playDir();
        const p=document.createElement("p");
        //p.innerHTML=this.name;
        const upperdiv=document.createElement("div");
        const bottomdiv=document.createElement("div");
        div.className="item_div elem";
        upperdiv.className="item_upperdiv elem";
        bottomdiv.className="item_bottomdiv elem";
        //let button=document.createElement("button");
        //button.innerText=this.isFile?"🎵":"📁";
        //button.style.fontSize="1.5rem";
        this.parent.appendChild(div);
        div.appendChild(upperdiv);
        div.appendChild(bottomdiv);
        //upperdiv.appendChild(button);
        upperdiv.appendChild(p);
    }
}

const items=[];
const bar=new Bar();
let currentDir="";
let isLoading=false;
//let {json_directory,json_isRelative};

function join(...parts){
    return parts
        .filter(p => p)
        .map(p => p.replace(/^\/+|\/+$/g,''))
        .join('/');
}
async function func(){
    const res=await fetch(`api/mfmusic`);
    const data=await res.json();
    init(data);
    bar.update();
}
function init(data){
    console.log(data);
    document.getElementById("Middle").innerHTML="";
    for(let file of data["val"]){
        items.push(new Item(file.name,file.isFile,items.length,document.getElementById("Middle")));
    }
}
async function getDir(dir){
    const res=await fetch(`api/mfmusic?dir=${encodeURIComponent(dir)}`);
    const data=await res.json();
    return data;
}
async function GoBack(){
    console.log(`api/mfmusicParent?dir=${currentDir}`);
    const res=await fetch(`api/mfmusicParent?dir=${currentDir}`);
    const data=await res.json();
    currentDir=data["current"];
    if(currentDir.startsWith("mfmusic")){
        currentDir=currentDir.slice(7).replaceAll('\\','/')
    }
    console.log(currentDir);
    init(data);
}
async function goSitt(){
    document.getElementById("Middle").innerHTML="";
    const sitt1=new sitting(document.getElementById("Middle"),undefined,0);
}

func();
document.getElementById("goBack").onclick=GoBack;
document.getElementById("sitt").onclick=goSitt;
