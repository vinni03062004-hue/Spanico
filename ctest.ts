import { conjugate, ALL_VERBS, IRREGULAR } from "./src/lib/conjugation";
const checks: [string,any,any,string][] = [
 ['ser','presente',0,'soy'],['estar','presente',2,'está'],['tener','futuro',0,'tendré'],
 ['ir','imperfecto',3,'íbamos'],['hacer','preterito',2,'hizo'],['poder','preterito',0,'pude'],
 ['decir','futuro',0,'diré'],['dar','preterito',2,'dio'],['saber','presente',0,'sé'],
 ['poner','futuro',0,'pondré'],['venir','preterito',0,'vine'],['dormir','preterito',2,'durmió'],
 ['pedir','preterito',2,'pidió'],['jugar','presente',0,'juego'],['oír','presente',2,'oye'],
 ['leer','preterito',2,'leyó'],['haber','presente',2,'ha'],['preferir','preterito',2,'prefirió'],
 ['conducir','preterito',2,'condujo'],['empezar','preterito',0,'empecé'],
 ['tener','imperfecto',0,'tenía'],['poner','imperfecto',0,'ponía'],['salir','futuro',0,'saldré'],
 ['contar','presente',0,'cuento'],['volver','presente',0,'vuelvo'],['pensar','presente',2,'piensa'],
 ['dar','futuro',0,'daré'],['traer','preterito',2,'trajo'],['ver','imperfecto',0,'veía'],
 ['hablar','presente',0,'hablo'],['comer','futuro',5,'comerán'],['vivir','preterito',2,'vivió'],
];
let ok=0; const bad:string[]=[];
for(const [v,t,p,e] of checks){const g=conjugate(v as any,t,p as any); if(g===e)ok++; else bad.push(`${v} ${t} ${p} -> ${g} (erwartet ${e})`);}
console.log('Verben im Trainer:',ALL_VERBS.length,'| unregelmäßig:',Object.keys(IRREGULAR).length);
console.log('Konjugationstests:',ok+'/'+checks.length);
if(bad.length)console.log('FEHLER:\n'+bad.join('\n'));
