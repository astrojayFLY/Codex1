const library = {
  beautiful: {
    title: '아름다운 세상', page: 16, bpm: 84, first: 0,
    notice: '16쪽 넷째 줄 끝의 낮은 시는 점2분음표(3박)로 보입니다. 원본대로 3박을 적용했습니다. 2번 끝마디의 세뇨 기호에 대응하는 D.S. 지시는 보이지 않아 끝의 D.C.와 Fine을 따릅니다.',
    rows: [
      "c.5 A.5~ | A c.5 B.5~ B B.5 B.5~ | B B.5 c.5 R c.5 A.5~ | A c.5 B.5~ B A.5 G.5~ | G2 R c.5 A.5~",
      "A e.5 d c B.5 | G#.5 A.5 B.5 c.5 R c.5 A.5~ | A e.5 d.5~ d c.5 c.5~ | c3 R",
      "R G.5 G.5 G.5 F.5 E.5 F.5~ | F.5 E C.5~ C2 | R E.5 E.5 E.5 B c.5~ | c3 R",
      "R F.5 F.5 F.5 E.5 D.5 E.5~ | E.5 E.5 G.5 C R.5 E.5 D.5~ | D D.5 D.5 D C.5 b.5~ | b3",
      "R G.5 G.5 G.5 F.5 E.5 F.5~ | F.5 E C.5~ C2 | R E.5 E.5 E.5 B c.5~ | c3 R",
      "R F.5 F.5 F.5 E.5 D.5 E.5~ | E.5 E.5 B.5 c.5~ c c.5 A.5~ | A c.5 B.5~ B B.5 c.5~ | c3 R | c2 R c.5 A.5~",
      "A c.5 B.5~ B B.5 B.5~ | B B.5 c.5 R c.5 A.5~ | A c.5 B.5~ B A.5 G.5~ | G2 R c.5 A.5~",
      "A e.5 d c B.5 | G#.5 A.5 B.5 c.5 R c.5 A.5~ | A e.5 d.5~ d c.5 c.5~ | c3 R"
    ],
    route: [[0,24],[9,23],[25,33],[0,8]],
    marks: {8:'Fine',9:'반복 시작',24:'1번 끝마디 ↺',25:'2번 끝마디 𝄋',33:'D.C. → Fine'}
  },
  jingle: {
    title:'징글벨', page:17, bpm:96, first:1, rows:[
      'E E E2 | E E E2 | E G C D | E3 R',
      'F F F F | F E E E | E D D E | D R G R',
      'E E E2 | E E E2 | E G C D | E3 R',
      'F F F F | F E E E | G G F D | C3 R'
    ]
  },
  rudolph: {
    title:'루돌프사슴코', page:18, bpm:92, first:17, rows:[
      'G.5 A G.5 E c | A G R2 | G.5 A.5 G.5 A.5 G c | B3 R',
      'F.5 G F.5 D B | A G R2 | G.5 A.5 G.5 A.5 G A | E3 R',
      'G.5 A G.5 E c | A G R2 | G.5 A.5 G.5 A.5 G c | B3 R',
      'F.5 G F.5 D B | A G R2 | G.5 A.5 G.5 A.5 G d | c3 R',
      'A A c A | G E.5 G.5 R2 | F A G F | E3 R',
      'D E G A | B B.5 B.5 R2 | c c B A | G F.5 D.5 R2',
      'G.5 A G.5 E c | A G R2 | G.5 A.5 G.5 A.5 G c | B3 R',
      'F.5 G F.5 D B | A G R2 | G.5 A.5 G.5 A.5 G d | c3 R'
    ]
  },
  santa: {
    title:'울면 안돼', page:19, bpm:88, first:49, rows:[
      'E.75 F.25 G G R | A.75 B.25 c c R | E.75 F.25 G G G | A.75 G.25 F.5 F.5 F F',
      'E G C E | D F F b | C4~ | C3 R',
      'd c B c | A.75 A.25 A A R | d c B c | A.75 A.25 A.5 A.5 A R',
      'e d c d | B B B B.75 c.25 | d.5 d.5 c B A | G3 R',
      'E.75 F.25 G G R | A.75 B.25 c c R | E.75 F.25 G G G | A.75 G.25 F.5 F.5 F F',
      'E G C E | D G G d | c4~ | c3 R'
    ]
  },
  star: {
    title:'작은별', bpm:80, first:1, rows:[
      'C C G G | A A G2 | F F E E | D D C2',
      'G G F F | E E D2 | G G F F | E E D2',
      'C C G G | A A G2 | F F E E | D D C2'
    ]
  }
};

const writtenPitch = {g:55,b:59,C:60,D:62,E:64,F:65,G:67,A:69,B:71,c:72,d:74,e:76};
function decodeSong(song) {
  const measures = song.rows.flatMap((row, line) => row.split('|').map(text => ({
    line, notes: text.trim().split(/\s+/).map(token => {
      const [, pitch, accidental, length, tie] = token.match(/^([A-Gb-egR])([#b]?)([\d.]*)(~?)$/);
      return {midi:pitch==='R'?null:writtenPitch[pitch]+(accidental==='b'?-1:Number(Boolean(accidental))),
        beats:Number(length||1), accidental:accidental==='b'?'♭':accidental, tie:Boolean(tie)};
    })
  })));
  return {meter:4,...song,measures};
}
