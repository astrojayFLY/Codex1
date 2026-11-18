const $ = id => document.getElementById(id);
const syll = ['도','레','미','파','솔','라','시'];
const semis = [0,2,4,5,7,9,11];
const palette = ['#c53649','#e17744','#f2d64c','#169368','#12aadb','#353da0','#87487e'];
const lowestBar = 55; // Written G3, the longest bar in the reference photo.
const highestBar = 81; // Written A5, the shortest bar.
const bars = new Map();
const staffOffsets = [0,0,1,1,2,3,3,4,4,5,5,6];
const samples = new Map();
const recordedPitch = {67:406,72:546,79:831,84:1110,91:1637,96:2248};
let loadingSamples, eventCycle=0, clickCycle=0;
let song, selected, shownLine, events, clicks, total, position, secondsPerBeat;
let audio, gain, instrumentGain, metroGain, sources = new Set(), origin, running = false, request = 0;
let malletAnimation;
let countStart = Infinity, countEnd = -Infinity, muted = false, version = 0, nextEvent = 0, nextClick = 0, currentIndex = -2;
let imported, previewURL, uploadVersion = 0;
const savedSongsKey='silofon.saved-songs.v1';
const savedSongs=new Map();
const positive = (value, modulus) => (value % modulus + modulus) % modulus;
function nameOf(midi, accidental) {
  if (midi === null) return '쉼';
  if (accidental === '♭') return nameOf(midi + 1) + '♭';
  const pc = positive(midi,12), oct = Math.floor(midi/12)-5;
  return syll[staffOffsets[pc]] + (semis.includes(pc) ? '' : '♯') +
    (oct < 0 ? ','.repeat(-oct) : '′'.repeat(oct));
}
function makeBars() {
  let naturalSlot = -1;
  for (let midi=lowestBar;midi<=highestBar;midi++) {
    const pitchClass = midi%12;
    const sharp = !semis.includes(pitchClass);
    if (!sharp) naturalSlot++;
    addBar(midi,naturalSlot+(sharp?.5:0),sharp,sharp?'#1262be':palette[staffOffsets[pitchClass]]);
  }
}
function addBar(midi,slot,sharp,color) {
  const button = document.createElement('button');
  button.className = 'bar ' + (sharp?'sharp':'natural');
  const height = sharp ? 39-slot*1.25 : 50-slot*1.67;
  button.style.setProperty('--x',4+slot*(92/15)+'%');
  button.style.setProperty('--height',height+'%');
  button.style.setProperty('--top',((sharp?26:72)-height/2)+'%');
  button.style.setProperty('--color',color);
  const label = nameOf(midi);
  button.textContent = label;
  const letter = document.createElement('small');
  letter.textContent = ['C','D','E','F','G','A','B'][staffOffsets[midi%12]] + (sharp?'♯':'');
  button.append(letter);
  button.setAttribute('aria-label',label+' 건반');
  button.onclick = async () => {
    if (running) return;
    const id = version;
    try {
      await ensureAudio();
      if (running || id!==version) return;
      for (const bar of bars.values()) bar.classList.remove('active');
      button.classList.add('active');
      strikeBar(button);
      playPitch(midi,audio.currentTime+.01,.45);
      setTimeout(() => {if(!running) button.classList.remove('active');},210);
    } catch (error) { $('state').textContent = error.message; }
  };
  bars.set(midi,button);
  $('instrument').append(button);
}
function parkMallet() {
  malletAnimation?.cancel();
  const mallet=$('mallet');
  mallet.style.removeProperty?.('left');
  mallet.style.removeProperty?.('top');
}
function strikeBar(bar) {
  const mallet=$('mallet');
  if(!bar) return;
  malletAnimation?.cancel();
  const dx=mallet.offsetLeft-bar.offsetLeft;
  const letter=bar.querySelector('small');
  const contact=bar.offsetTop+(letter?letter.offsetTop+letter.offsetHeight+15:bar.offsetHeight*.82);
  const dy=mallet.offsetTop-contact;
  mallet.style.left=bar.offsetLeft+'px';
  mallet.style.top=contact+'px';
  if(!mallet.animate||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  malletAnimation=mallet.animate([
    {transform:'translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px)) rotate(10deg)'},
    {transform:'translate(-50%, calc(-50% + 14px)) rotate(10deg)',offset:.55},
    {transform:'translate(-50%, -50%) rotate(0)',offset:.78},
    {transform:'translate(-50%, calc(-50% + 5px)) rotate(4deg)',offset:.91},
    {transform:'translate(-50%, -50%) rotate(0)'}
  ],{duration:180,easing:'ease-out'});
}
function buildTimeline() {
  const mode = $('loop').value;
  let order = song.route?.flatMap(([a,b])=>range(a,b)) || range(0,song.measures.length-1);
  if(mode==='line') order = range(0,song.measures.length-1).filter(i=>song.measures[i].line===Number($('line').value));
  if(mode==='measure') order = range(Number($('from').value),Number($('to').value));
  events = [];
  clicks = [];
  total = 0;
  let previous;
  for(const measure of order) {
    let beat = 0;
    const row = song.measures[measure];
    for (const [index,note] of row.notes.entries()) {
      const event = {...note, measure,index,line:row.line,start:total+beat,held:false};
      if(previous?.tie && previous.midi===event.midi && event.midi!==null) {
        event.held = true;
        event.attack = previous.attack;
        event.attack.length += event.beats;
      } else {
        event.attack = event;
        event.length = event.beats;
      }
      events.push(event);
      previous=event;
      beat += note.beats;
    }
    const pulse = 4/(row.beatType || song.beatType || 4);
    const pickup = measure===0 && beat < (row.meter || song.meter)*pulse;
    for(let b=0;b<beat-1e-8;b+=pulse) clicks.push({start:total+b,strong:b===0&&!pickup});
    total += beat;
  }
}
function range(a,b) {return Array.from({length:b-a+1},(_,i)=>a+i);}
function option(select,index,label) {select.add(new Option(label,index));}
function selectSong(id) {
  halt(true);
  selected=id;
  song = savedSongs.get(id) || (id==='custom'?imported:decodeSong(library[id]));
  $('songs').value=id;
  $('title').textContent=song.title;
  for(const key of ['line','from','to']) $(key).replaceChildren();
  [...new Set(song.measures.map(m=>m.line))].forEach(i=>option($('line'),i,(i+1)+'번째 줄'));
  song.measures.forEach((_,i)=>['from','to'].forEach(key=>option($(key),i,measureName(i))));
  $('loop').value='none';
  const outside = [...new Set(song.measures.flatMap(m=>m.notes.map(n=>n.midi)).filter(m=>m!==null&&!bars.has(m)))];
  $('notice').textContent = [song.notice,outside.length?'건반 배열에 없는 음 '+outside.map(m=>nameOf(m)).join(', ')+'은 악보와 연주 소리로 표시합니다.':null].filter(Boolean).join(' ');
  resetLoop();
}
function measureName(i) {return song.first===0&&i===0?'못갖춘마디':(song.first+i)+'마디';}
function resetLoop() {
  halt(true);
  const mode=$('loop').value;
  $('lineField').hidden=mode!=='line';
  $('fromField').hidden=$('toField').hidden=mode!=='measure';
  if(Number($('to').value)<Number($('from').value)) $('to').value=$('from').value;
  buildTimeline();
  paint(-1,true);
}
function staffNote(n,x) {
  const midi = n.accidental==='♭'?n.midi+1:n.midi;
  const y = n.midi===null?42:70-5*((Math.floor(midi/12)-5)*7+staffOffsets[positive(midi,12)]);
  const open=n.beats>=2;
  const down=y<41, sign=down?-1:1;
  const flags=n.beats<=.25?2:n.beats<1?1:0;
  const dots=[.75,1.5,3,6].includes(n.beats);
  let marks='';
  if(n.midi===null) {
    if(n.beats>=2) marks='<rect x="-6" y="'+(n.beats>=4?40:35)+'" width="12" height="5" fill="currentColor"/>';
    else if(n.beats>=1) marks='<path d="M 0 30 l 5 7 l -5 6 l 4 5 q -8 -2 -4 6" fill="none" stroke="currentColor" stroke-width="2.2"/>';
    else marks='<path d="M 5 31 l -7 22 M 4 35 q -9 5 -8 -2" stroke="currentColor" fill="none" stroke-width="2"/>'+(flags===2?'<path d="M 1 44 q -9 5 -8 -2" stroke="currentColor" fill="none" stroke-width="2"/>':'');
  } else {
    for(let h=70;h<=y && h<=90;h+=10) marks+='<path d="M -10 '+h+' h 20" stroke="currentColor"/>';
    for(let h=10;h>=y && h>=0;h-=10) marks+='<path d="M -10 '+h+' h 20" stroke="currentColor"/>';
    marks+='<ellipse cx="0" cy="'+y+'" rx="'+(n.beats>=4?9:7)+'" ry="4.8" transform="rotate(-13 0 '+y+')" fill="'+(open?'#fff':'currentColor')+'" stroke="currentColor" stroke-width="1.6"/>';
    if(n.beats<4) {
      const stem=5*sign, top=y-25*sign;
      marks+='<path d="M '+stem+' '+y+' V '+top+'" stroke="currentColor" stroke-width="1.5"/>';
      for(let i=0;i<flags;i++) marks+='<path d="M '+stem+' '+(top+i*6*sign)+' q 10 '+(8*sign)+' 6 '+(16*sign)+'" stroke="currentColor" stroke-width="1.8" fill="none"/>';
    }
    if(n.accidental) marks+='<text x="-15" y="'+(y+4)+'" text-anchor="middle" font-size="14">'+(n.accidental==='#'?'♯':n.accidental)+'</text>';
    if(n.tie) marks+='<path d="M 3 '+(y+6)+' q 12 9 23 0" stroke="currentColor" fill="none"/>';
  }
  if(dots) marks+='<circle cx="11" cy="'+(y-2)+'" r="1.8" fill="currentColor"/>';
  return '<g class="note" transform="translate('+x+' 0)"><rect class="hit" x="-16" y="1" width="32" height="108" rx="7"/>'+marks+
    '<text x="0" y="102" fill="currentColor" text-anchor="middle" font-size="16" font-weight="bold">'+nameOf(n.midi,n.accidental)+'</text></g>';
}
function drawLine(line) {
  shownLine=line;
  const cells=song.measures.map((m,i)=>({m,i})).filter(({m})=>m.line===line);
  const totalLines=song.measures.at(-1).line+1;
  const firstBar=line===0 ? 74 : 53;
  let x=firstBar;
  const measures=cells.map(({m,i})=>{
    const width=Math.max(105,31*m.notes.length+12);
    const start=x;
    x+=width;
    const notes=m.notes.map((n,j)=>staffNote(n,5+(j+.5)*(width-10)/m.notes.length)).join('');
    const label=measureName(i)+(song.marks?.[i]?' · '+song.marks[i]:'');
    return '<g class="staff-measure" data-measure="'+i+'" transform="translate('+start+' 0)">'+
      '<title>'+label+'</title><path class="barline" d="M 0 20 V 60"/>'+
      '<text class="staff-number" x="0" y="12" text-anchor="start">'+(song.first+i)+'</text>'+notes+'</g>';
  }).join('');
  const end=x;
  const staff=[20,30,40,50,60].map(y=>'<path d="M 8 '+y+' H '+end+'"/>').join('');
  const last=line===totalLines-1;
  const ending='<path class="barline" d="M '+end+' 20 V 60"/>'+
    (last?'<path class="barline final" d="M '+(end+4)+' 20 V 60"/>':'');
  const meter=line===0?'<text class="staff-meter" x="53" y="39">'+song.meter+'</text><text class="staff-meter" x="53" y="58">'+(song.beatType||4)+'</text>':'';
  $('score').innerHTML='<svg class="staff" style="--staff-min:'+Math.round((end+12)*.8)+'px" role="img" aria-label="'+(line+1)+'번째 악보 줄" viewBox="0 -4 '+(end+12)+' 114">'+
    '<g class="staff-lines">'+staff+'</g><text class="staff-clef" x="11" y="63">𝄞</text>'+meter+measures+ending+'</svg>';
  $('lineCount').textContent=(line+1)+' / '+totalLines+'줄';
  $('previousLine').disabled=line===0;
  $('nextLine').disabled=line===totalLines-1;
  $('previousLine').onclick=()=>browseLine(line-1);
  $('nextLine').onclick=()=>browseLine(line+1);
}
function browseLine(line) {
  if(running) return;
  const mode=$('loop').value;
  if(mode==='line') {
    $('line').value=String(line);
    resetLoop();
    return;
  }
  let index=events.findIndex(event=>event.line===line);
  if(index<0 && mode==='measure') {
    $('loop').value='none';
    resetLoop();
    index=events.findIndex(event=>event.line===line);
  }
  if(index<0) return;
  halt(true);
  position=events[index].start;
  paint(-1,true);
  if(shownLine!==line) drawLine(line);
}
function paint(index, force=false) {
  if(index===currentIndex&&!force) return;
  currentIndex=index;
  const now=events[index];
  const isStrike=note=>note.midi!==null && !note.held;
  const next=events.find((note,i)=>i>index && (index>=0||note.start>=position) && isStrike(note)) ||
    ($('loop').value!=='none' ? events.find(isStrike) : undefined);
  const line = now?.line ?? events.find(event=>event.start>=position)?.line ?? 0;
  if(shownLine!==line||force) drawLine(line);
  $('score').querySelector('.note.active')?.classList.remove('active');
  if(now) {
    const cell=$('score').querySelector('[data-measure="'+now.measure+'"]');
    cell?.querySelectorAll('.note')[now.index]?.classList.add('active');
  }
  for(const [midi,bar] of bars) {
    bar.classList.toggle('active',now?.midi===midi);
    bar.classList.toggle('upcoming',next?.midi===midi);
  }
  if(now && !now.held) strikeBar(bars.get(now.midi));
  $('cue').textContent=now?nameOf(now.midi,now.accidental):'준비';
  $('state').textContent=now?measureName(now.measure)+(now.held?' · 이어서 울려요':now.midi!==null&&!bars.has(now.midi)?' · 건반 없음':''):'연주 준비';
}
async function ensureAudio() {
  if(!audio) {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context) throw Error('이 브라우저에서 오디오를 시작할 수 없어요.');
    audio=new Context();
    gain=audio.createGain();
    gain.connect(audio.destination);
    instrumentGain=audio.createGain();
    instrumentGain.gain.setValueAtTime(1.55,audio.currentTime);
    instrumentGain.connect(gain);
    metroGain=audio.createGain();
    metroGain.connect(gain);
    metroGain.gain.setValueAtTime(1.5,audio.currentTime);
    updateMute();
  }
  if(audio.state==='suspended') await audio.resume();
  loadingSamples ??= Promise.all(Object.entries(recordings).map(async ([midi,data])=>{
    const bytes=Uint8Array.from(atob(data),char=>char.charCodeAt(0));
    return [Number(midi),await audio.decodeAudioData(bytes.buffer)];
  })).then(decoded=>decoded.forEach(([midi,buffer])=>samples.set(midi,buffer))).catch(()=>{
    $('audioCredit').textContent='녹음 로드 실패 · 합성 실로폰 소리';
  });
  await loadingSamples;
}
function updateMute() {if(gain) gain.gain.setValueAtTime(muted?0:1,audio.currentTime);}
function track(node,time) {
  sources.add(node);
  node.onended=()=>sources.delete(node);
  node.start(time);
}
function playPitch(writtenMidi,time,length) {
  const midi = writtenMidi + 12*Number($('soundOctave').value || 0);
  const frequency=440*2**((midi-69)/12);
  if(samples.size) {
    const pitchDistance=key=>Math.abs(Math.log2(frequency/recordedPitch[key]));
    const nearest=[...samples.keys()].reduce((a,b)=>pitchDistance(a)<=pitchDistance(b)?a:b);
    const source=audio.createBufferSource();
    source.buffer=samples.get(nearest);
    source.playbackRate.value=frequency/recordedPitch[nearest];
    const envelope=audio.createGain();
    const limit=Math.min(source.buffer.duration/source.playbackRate.value,Math.max(.7,length+.36));
    envelope.gain.setValueAtTime(1,time);
    envelope.gain.setValueAtTime(1,time+limit*.63);
    envelope.gain.linearRampToValueAtTime(0,time+limit);
    source.connect(envelope).connect(instrumentGain);
    track(source,time);
    source.stop(time+limit);
    return;
  }
  const duration=Math.min(2.5,Math.max(.18,length*.94));
  [1,2.76,5.4].forEach((partial,i)=>{
    const node=audio.createOscillator(), envelope=audio.createGain();
    node.frequency.value=frequency*partial;
    envelope.gain.setValueAtTime(.0001,time);
    envelope.gain.exponentialRampToValueAtTime([.17,.04,.016][i],time+.004);
    envelope.gain.exponentialRampToValueAtTime(.0001,time+duration*[1,.68,.32][i]);
    node.connect(envelope).connect(instrumentGain);
    track(node,time);
    node.stop(time+duration+.02);
  });
}
function tickSound(time,strong) {
  const node=audio.createOscillator(), envelope=audio.createGain();
  node.frequency.value=strong?1180:820;
  envelope.gain.setValueAtTime(.095,time);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+.065);
  node.connect(envelope).connect(metroGain);
  track(node,time);
  node.stop(time+.07);
}
function heardTime() {
  const stamp=audio.getOutputTimestamp?.();
  return stamp?.performanceTime>0?Math.min(audio.currentTime,stamp.contextTime+(performance.now()-stamp.performanceTime)/1000):
    audio.currentTime-(audio.outputLatency||0);
}
function schedule() {
  if(!running) return;
  const horizon=(audio.currentTime+.11-origin)/secondsPerBeat;
  const loop=$('loop').value!=='none';
  function fill(items, index, cycle, fire) {
    while(index<items.length && items[index].start+cycle*total<=horizon) {
      const item=items[index++];
      const time=origin+(item.start+cycle*total)*secondsPerBeat;
      if(time>=audio.currentTime-.04) fire(item,Math.max(time,audio.currentTime));
      if(loop&&index===items.length) {index=0;cycle++;}
    }
    return [index,cycle];
  }
  [nextEvent,eventCycle]=fill(events,nextEvent,eventCycle,(note,time)=>{
    if(note.midi!==null&&!note.held) playPitch(note.midi,time,note.length*secondsPerBeat);
  });
  [nextClick,clickCycle]=fill(clicks,nextClick,clickCycle,(click,time)=>{
    if($('metro').checked) tickSound(time,click.strong);
  });
  const heard=heardTime();
  const elapsed=(heard-origin)/secondsPerBeat;
  const counting=heard>=countStart&&heard<countEnd;
  $('countDisplay').hidden=!counting;
  const beat=loop&&elapsed>=0?positive(elapsed,total):elapsed;
  if(!loop&&beat>=total) {
    halt(true);
    $('cue').textContent='완료';
    $('state').textContent='연주가 끝났어요';
    return;
  }
  if(counting) {
    const pulseSeconds=secondsPerBeat*4/(song.beatType||4);
    $('countNumber').textContent=String(Math.min(song.meter,Math.ceil((countEnd-heard)/pulseSeconds)));
  } else if(beat>=0&&heard>=countEnd) {
    let lo=0,hi=events.length;
    while(lo<hi) {
      const mid=(lo+hi)>>1;
      if(events[mid].start<=beat) lo=mid+1; else hi=mid;
    }
    paint(lo-1);
  }
  request=requestAnimationFrame(schedule);
}
function halt(reset=false) {
  version++;
  if(running&&!reset&&heardTime()>=countEnd) {
    const beat=Math.max(0,(heardTime()-origin)/secondsPerBeat);
    position=$('loop').value==='none'?Math.min(total,beat):positive(beat,total);
  }
  running=false;
  $('countDisplay').hidden=true;
  if(reset) parkMallet();
  cancelAnimationFrame(request);
  for(const source of sources) {try {source.stop();} catch {}}
  sources.clear();
  if(reset) position=0;
  $('play').textContent=position>0?'▶ 이어서 연주':'▶ 연주 시작';
}
async function start(countIn) {
  const id=++version;
  try {await ensureAudio();} catch(error) { $('state').textContent=error.message; return; }
  if(version!==id||!events.length) return;
  secondsPerBeat=60/(song.bpm*Number($('speed').value));
  const pulse=4/(song.beatType||4);
  const lead=countIn?song.meter*pulse:0;
  const t=audio.currentTime+.08;
  countStart=lead?t:Infinity;
  countEnd=t+lead*secondsPerBeat;
  origin=t+(lead-position)*secondsPerBeat;
  nextEvent=events.findIndex(n=>n.start>=position);
  if(nextEvent<0) nextEvent=events.length;
  nextClick=clicks.findIndex(n=>n.start>=position);
  if(nextClick<0) nextClick=clicks.length;
  for(let b=0;b<lead;b+=pulse) tickSound(t+b*secondsPerBeat,b===0);
  if(position>0) {
    const event=events[nextEvent-1];
    if(event?.midi!==null&&event?.attack && event.attack.start+event.attack.length>position)
      playPitch(event.midi,countEnd,(event.attack.start+event.attack.length-position)*secondsPerBeat);
  }
  eventCycle=clickCycle=0;
  if($('loop').value!=='none') {
    if(nextEvent===events.length) {nextEvent=0;eventCycle=1;}
    if(nextClick===clicks.length) {nextClick=0;clickCycle=1;}
  }
  running=true;
  currentIndex=-2;
  $('play').textContent='Ⅱ 일시정지';
  schedule();
}
function manualScore(text,meter) {
  function read(token) {
    const [name,length,...extra]=token.split(':');
    const beats=length===undefined?1:Number(length);
    if(extra.length||![.25,.5,.75,1,1.5,2,3,4].includes(beats)) throw Error('음 길이를 확인해 주세요 · '+token);
    if(name==='쉼'||name==='-') return {midi:null,beats};
    const match=name.match(/^([도레미파솔라시])([#♯b♭]?)(['′]{0,2}|,)$/);
    if(!match) throw Error('계이름을 확인해 주세요 · '+token);
    const accidental=match[2]?(match[2]==='b'||match[2]==='♭'?'♭':'#'):'';
    const midi=60+semis[syll.indexOf(match[1])]+(match[3]===','?-12:12*match[3].length)+(accidental==='♭'?-1:accidental?1:0);
    if(!bars.has(midi)) throw Error('실로폰 음역을 벗어난 음 · '+token);
    return {midi,beats,accidental};
  }
  const groups=text.trim().split('|');
  const measures=[];
  for(const group of groups) {
    const tokens=group.trim().split(/\s+/).filter(Boolean);
    if(!tokens.length) throw Error('비어 있는 마디를 확인해 주세요.');
    let notes=[], count=0;
    for(const token of tokens) {
      const note=read(token);
      if(count+note.beats>meter) throw Error('마디의 박자 합을 확인해 주세요 · '+token);
      count+=note.beats;
      notes.push(note);
      if(groups.length===1&&count===meter) {
        measures.push({notes,line:Math.floor(measures.length/4)});
        notes=[];
        count=0;
      }
    }
    if(notes.length) measures.push({notes,line:Math.floor(measures.length/4)});
  }
  return {title:'내가 입력한 곡',first:1,bpm:84,meter,measures};
}
function musicXMLToScore(xml) {
  const doc=new DOMParser().parseFromString(xml,'application/xml');
  if(doc.querySelector('parsererror')||doc.documentElement.localName!=='score-partwise') throw Error('단선율 score-partwise MusicXML을 올려 주세요.');
  const parts=doc.querySelectorAll('score-partwise > part');
  if(parts.length!==1) throw Error('한 파트로 된 MusicXML을 올려 주세요.');
  if(doc.querySelector('backup, chord, grace, transpose, ending, time-modification, unpitched, segno, coda, sound[dacapo], sound[dalsegno], sound[tocoda], sound[fine]'))
    throw Error('화음, 여러 성부, 잇단음표, 조옮김 또는 복합 반복이 포함된 악보는 지원하지 않습니다.');
  const val=(root,selector)=>root.querySelector(selector)?.textContent.trim();
  let divisions=1,meter=4,beatType=4,line=0, repeatStart=0;
  const route=[], marks={}, measures=[];
  const meterLabel={};
  const steps=['C','D','E','F','G','A','B'];
  for(const [i,measure] of Array.from(parts[0].children).filter(n=>n.localName==='measure').entries()) {
    divisions=Number(val(measure,'attributes > divisions')||divisions);
    meter=Number(val(measure,'attributes > time > beats')||meter);
    beatType=Number(val(measure,'attributes > time > beat-type')||beatType);
    if(!(divisions>0&&Number.isInteger(meter)&&meter>=1&&meter<=16&&[2,4,8,16].includes(beatType))) throw Error('MusicXML의 박자 정보를 확인해 주세요.');
    if(!i) Object.assign(meterLabel,{meter,beatType});
    else if(measure.querySelector('print[new-system="yes"], print[new-page="yes"]')||i%4===0) line++;
    if(measure.querySelector('forward')) throw Error('빈 시간 구간이 있는 MusicXML은 쉼표로 바꿔 주세요.');
    const notes=Array.from(measure.children).filter(n=>n.localName==='note').map(note=>{
      const pitch=note.querySelector('pitch'), rest=note.querySelector('rest');
      const beats=Number(val(note,'duration'))/divisions;
      if(!(beats>0&&beats<=64)) throw Error('음표 길이를 확인할 수 없습니다. '+(i+1)+'마디');
      if(rest) return {midi:null,beats};
      if(!pitch) throw Error('음높이를 확인할 수 없습니다. '+(i+1)+'마디');
      const step=steps.indexOf(val(pitch,'step')), octave=Number(val(pitch,'octave'));
      const shift=Number(val(pitch,'alter')||0);
      if(step<0||!Number.isInteger(octave)||![-1,0,1].includes(shift)) throw Error('지원하지 않는 음높이입니다. '+(i+1)+'마디');
      const midi=(octave+1)*12+semis[step]+shift;
      if(!bars.has(midi)) throw Error('실로폰 음역을 벗어난 음 · '+nameOf(midi));
      const explicit=val(note,'accidental');
      const accidental=explicit==='natural'?'♮':shift<0?'♭':shift>0?'#':'';
      return {midi,beats,accidental,tie:!!note.querySelector('tie[type="start"], tied[type="start"]')};
    });
    if(!notes.length) throw Error('음표나 쉼표가 없는 마디가 있습니다. '+(i+1)+'마디');
    const forward=measure.querySelector('repeat[direction="forward"]');
    const backward=measure.querySelector('repeat[direction="backward"]');
    if(forward) {repeatStart=i;marks[i]='반복 시작';}
    measures.push({line,notes,meter,beatType});
    route.push([i,i]);
    if(backward) {
      const times=Number(backward.getAttribute('times')||2);
      if(!Number.isInteger(times)||times<1||times>8) throw Error('반복 횟수는 1~8회까지 지원합니다.');
      for(let pass=1;pass<times;pass++) route.push([repeatStart,i]);
      repeatStart=i+1;
      marks[i]='반복 끝';
    }
  }
  if(!measures.length) throw Error('읽을 수 있는 마디가 없습니다.');
  const bpm=Number(doc.querySelector('sound[tempo]')?.getAttribute('tempo')||84);
  return {title:val(doc,'movement-title')||val(doc,'work-title')||'불러온 MusicXML',first:1,bpm:bpm>0&&bpm<=400?bpm:84,measures,route,marks,...meterLabel};
}
function useCustom(data) {
  if($('keepSong').checked) {
    const id='saved-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    try {
      localStorage.setItem(savedSongsKey,JSON.stringify([...savedSongs,[id,data]]));
      savedSongs.set(id,data);
      addSong(id,data.title);
      selectSong(id);
      return '연습곡 목록에 저장했어요.';
    } catch {
      openTemporarySong(data);
      return '브라우저 저장소를 사용할 수 없어 이번에만 악보를 열었어요.';
    }
  }
  openTemporarySong(data);
  return '연주할 악보를 열었어요.';
}
function openTemporarySong(data) {
  imported=data;
  if(!Array.from($('songs').options).some(option=>option.value==='custom')) addSong('custom','내 악보');
  selectSong('custom');
}
function loadSavedSongs() {
  try {
    for(const [id,data] of JSON.parse(localStorage.getItem(savedSongsKey)||'[]')) {
      if(typeof id!=='string'||!id.startsWith('saved-')||typeof data?.title!=='string'||!data.measures?.length) continue;
      savedSongs.set(id,data);
      addSong(id,data.title);
    }
  } catch {}
}
function addSong(id,title) {
  option($('songs'),id,title);
}
$('songs').onchange=()=>selectSong($('songs').value);
$('play').onclick=()=>{
  if(running) {
    halt();
    $('state').textContent='일시정지';
  } else start(true);
};
$('stop').onclick=()=>{
  if(events[0]?.measure!==0) $('loop').value='none';
  resetLoop();
};
$('speed').oninput=()=>{
  $('rate').textContent=Number($('speed').value).toFixed(2)+'×';
  if(running) {halt(); start(false);}
};
$('silent').onclick=()=>{
  muted=!muted;
  $('silent').setAttribute('aria-pressed',String(muted));
  $('silent').querySelector('span').textContent=muted?'🔇':'🔊';
  updateMute();
};
$('soundOctave').onchange=()=>{
  if(running) {halt(); start(false);}
};
for(const id of ['loop','line','from','to']) $(id).onchange=resetLoop;
$('fullscreen').onclick=async()=>{
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { $('fullscreen').textContent='전체 화면 사용 불가'; }
};
document.addEventListener('fullscreenchange',()=>{
  $('fullscreen').textContent=document.fullscreenElement?'⛶ 전체 화면 닫기':'⛶ 전체 화면';
});
$('apply').onclick=()=>{
  try {
    const data=manualScore($('custom').value,Number($('meter').value));
    data.title=$('customTitle').value.trim()||'내 악보';
    $('editStatus').textContent=useCustom(data);
  } catch(error) { $('editStatus').textContent=error.message; }
};
$('download').onclick=()=>{
  const url=URL.createObjectURL(new Blob([$('custom').value],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');
  link.href=url;
  link.download='실로폰_악보.txt';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('upload').onchange=async event=>{
  const file=event.target.files[0];
  if(!file) return;
  const ticket=++uploadVersion;
  try {
    const name=file.name.toLowerCase();
    if(/\.(musicxml|xml|txt)$/.test(name)) {
      const content=await file.text();
      if(ticket!==uploadVersion) return;
      const isText=name.endsWith('.txt');
      const data=isText?manualScore(content,Number($('meter').value)):musicXMLToScore(content);
      data.title=$('customTitle').value.trim()||(isText?file.name.replace(/\.txt$/i,''):data.title);
      const status=useCustom(data);
      if(isText) $('custom').value=content;
      if(previewURL) URL.revokeObjectURL(previewURL);
      $('previewArea').replaceChildren();
      $('uploadStatus').textContent=status;
    } else if(file.type.startsWith('image/')||name.endsWith('.pdf')) {
      if(previewURL) URL.revokeObjectURL(previewURL);
      previewURL=URL.createObjectURL(file);
      const image=file.type.startsWith('image/');
      const element=document.createElement(image?'img':'iframe');
      element.className=image?'preview':'preview-frame';
      if(image) element.alt='업로드한 참고 악보';
      element.title='업로드한 참고 악보';
      element.src=previewURL;
      $('previewArea').replaceChildren(element);
      $('uploadStatus').textContent='참고 악보를 열었어요. 연주하려면 위 입력란에 계이름을 입력하세요.';
    } else throw Error('지원하지 않는 파일 형식입니다.');
  } catch(error) { if(ticket===uploadVersion) $('uploadStatus').textContent=error.message; }
  finally { if(ticket===uploadVersion) event.target.value=''; }
};
makeBars();
Object.entries(library).sort(([,a],[,b])=>(a.page||Infinity)-(b.page||Infinity))
  .forEach(([id,data])=>addSong(id,data.page?(data.page-2)+'. '+data.title:data.title));
loadSavedSongs();
selectSong('beautiful');



function fitLessonToViewport() {
  const instrument=$('instrument');
  const lesson=document.querySelector('.lesson');
  const viewportHeight=document.documentElement.clientHeight;
  const fixedHeight=lesson.getBoundingClientRect().bottom+window.scrollY-instrument.getBoundingClientRect().height;
  const available=Math.floor(viewportHeight-fixedHeight-10);
  instrument.style.setProperty('--instrument-height',Math.min(680,Math.max(150,available))+'px');
}
if(window.ResizeObserver) {
  const layoutObserver=new ResizeObserver(fitLessonToViewport);
  document.querySelectorAll('header, .intro, .lesson .controls, .score-panel').forEach(element=>layoutObserver.observe(element));
  window.addEventListener('resize',fitLessonToViewport);
}
