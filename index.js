let pointer={
    isdown:false,
    x:0,
    y:0,
    ctx:{wasDown:false}
};

const updatePos=(e)=>{
    pointer.x=e.clientX;
    pointer.y=e.clientY;
};

window.addEventListener("pointerdown",(e)=>{
    pointer.isdown=true;
    updatePos(e);
});
window.addEventListener("pointerup",(e)=>{
    pointer.isdown=false;
});
window.addEventListener("pointermove",(e)=>{
    updatePos(e);
});




class Item{
    constructor(name,isFile,index,parent){
        this.index=index;
        this.isFile=isFile;
        this.CT=0;
        this.name=name;
        this.parent=parent;
        this.prog_time=0;//////////////////////////////
        const div=document.createElement("div");
        div.onclick=this.isFile?()=>{this.updateCtx();this.playFile()}:()=>this.playDir();
        const p=document.createElement("p");
        p.innerHTML=this.name;
        const upperdiv=document.createElement("div");
        const bottomdiv=document.createElement("div");
            div.className="item_div elem";
            upperdiv.className="item_upperdiv elem";
            bottomdiv.className="item_bottomdiv elem";
            let button=document.createElement("button");
            button.innerText=this.isFile?"🎵":"📁";
            button.style.fontSize="1.5rem";
        this.Img=this.isFile?document.createElement("img"):null;
        if(this.isFile){
            this.Img.className="item_img";
            this.getAlbumArt(`${join("mfmusic",currentDir,this.name)}`,this.Img);
            bottomdiv.appendChild(this.Img);

        }
        else{
            div.style.height="100px";
            upperdiv.style.flex="2 1 0";
        }
        this.parent.appendChild(div);
        div.appendChild(upperdiv);
        div.appendChild(bottomdiv);
        upperdiv.appendChild(button);
        upperdiv.appendChild(p);

        
    }

    async getAlbumArt(path,Img) {
        const response = await fetch(path);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();

        const buffer = await blob.arrayBuffer();
        
        Img.src= this.parseBufferForImage(buffer);
    }


        parseBufferForImage(buffer) {
    const view = new DataView(buffer);

    if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
        return "./imgs/default.png";
    }

    const scanLimit = Math.min(buffer.byteLength, 100000); 

    for (let i = 0; i < scanLimit; i++) {
        if (view.getUint8(i) === 65 && view.getUint8(i + 1) === 80 &&
            view.getUint8(i + 2) === 73 && view.getUint8(i + 3) === 67) {

        const frameSize = view.getUint32(i + 4);

        for (let j = i + 10; j < i + 50; j++) {
            const byte1 = view.getUint8(j);
            const byte2 = view.getUint8(j + 1);

            if ((byte1 === 0xFF && byte2 === 0xD8) || (byte1 === 0x89 && byte2 === 0x50)) {
            const imgData = buffer.slice(j, j + frameSize);
            return URL.createObjectURL(new Blob([imgData]));
            }
        }
        }
    }
    return "./imgs/default.png";
    }
    playFile(){
        const audio=document.getElementById("audio");
        audio.src=`${join("mfmusic",bar.ctx.currentDir,this.name)}`;
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
        this.time.style.marginRight="0";
        this.Textname.style.width="80%";
        this.Textname.style.overflow="hidden"
        
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
        this.ctx={index:null,items:undefined,currentDir:undefined/*,paused:false*/};
        this.reset("");
    }
    reset(name){
        this.name=name;
        this.pos=0;
        this.progressCircle.style.left="0%";
        {
            this.progressbar.style.top=`50%`;
            this.progressbar.style.left=`50%`;
            this.progressbar.style.transform=`translate(-50%,-50%)`;
            this.Textname.innerText=this.name;
        }
    }
    handleFinished(){
        if(this.ctx.index<items.length){
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
    }
    handlePauseAndPlay(){
        if(this.audio.paused){
            this.audio.play();
            return;
        }
        this.audio.pause();
    }
    
    update(){
        
        if(pointer.ctx.wasDown&&!this.audio.paused){
                let paused=this.audio.paused;
                console.log(paused);
                if(this.CT||this.CT===0){this.audio.currentTime=this.CT;}
                this.audio.pause();
                console.log(this.audio.paused);
                pointer.ctx.wasDown=false;
            }
        if(!this.audio.paused){
            const progress=(this.audio.currentTime/this.audio.duration)*100;
            this.progressCircle.style.left=`${progress?progress:0}%`;
            this.time.innerText=`${Math.floor(this.audio.currentTime/60)}:${Math.floor(this.audio.currentTime%60).toString().padStart(2,'0')}`;
        }

        if(pointer.isdown){//
            const rec=this.div.getBoundingClientRect();
            const proRec=this.progressbar.getBoundingClientRect();
            const yCenter=(rec.top+rec.bottom)/2
            if(Math.abs(yCenter-pointer.y)<rec.height/2){
                pointer.ctx.wasDown=true;
                let X=Math.max(proRec.left,Math.min(proRec.right,pointer.x))-proRec.left;
                this.CT=(X/(proRec.right-proRec.left))*this.audio.duration;
                const progress=((pointer.x-proRec.left)/(proRec.width))*100;
                this.progressCircle.style.left=`${progress}%`;
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
// let currentHasChange=false;
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
    const res=await fetch(`api/mfmusicParent?dir=${currentDir}`);
    const data=await res.json();
    currentDir=data["current"];
    if(currentDir.startsWith("mfmusic")){
        currentDir=currentDir.slice(7).replaceAll('\\','/')
    }
    init(data);
}
async function goSitt(){
    document.getElementById("Middle").innerHTML="";
    const sitt1=new sitting(document.getElementById("Middle"),undefined,0);
}

func();
document.getElementById("goBack").onclick=GoBack;
document.getElementById("sitt").onclick=goSitt;
bar.pauseButton.onclick=()=>bar.handlePauseAndPlay();
const audio=document.getElementById("audio");
audio.addEventListener("ended",()=>bar.handleFinished());
// audio.addEventListener("play",()=>{});