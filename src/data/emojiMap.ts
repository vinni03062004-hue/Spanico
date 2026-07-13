// Emoji-Zuordnung für konkrete Begriffe -> größerer, abwechslungsreicher Bildpool
// für den Bildermodus. Wird beim Aufbau des Wortschatzes automatisch angewendet.
export const EMOJI_MAP: Record<string, string> = {
  // Essen & Trinken
  agua: "💧", café: "☕", pan: "🍞", leche: "🥛", vino: "🍷", cerveza: "🍺",
  carne: "🥩", pescado: "🐟", fruta: "🍎", manzana: "🍎", naranja: "🍊", plátano: "🍌",
  tomate: "🍅", patata: "🥔", arroz: "🍚", huevo: "🥚", queso: "🧀", azúcar: "🧂",
  sal: "🧂", sopa: "🍲", ensalada: "🥗", té: "🍵", zumo: "🧃", comida: "🍽️",
  // Tiere & Natur
  perro: "🐕", gato: "🐈", animal: "🐾", sol: "☀️", lluvia: "🌧️", viento: "💨",
  nieve: "❄️", cielo: "🌤️", mar: "🌊", montaña: "⛰️", río: "🏞️", árbol: "🌳",
  flor: "🌸", fuego: "🔥", playa: "🏖️",
  // Körper
  cabeza: "🧠", mano: "✋", ojo: "👁️", pie: "🦶", boca: "👄", nariz: "👃",
  oreja: "👂", diente: "🦷", corazón: "❤️", pelo: "💇", cara: "🙂", brazo: "💪",
  pierna: "🦵", ojos: "👀", manos: "🙌", sangre: "🩸",
  // Kleidung
  ropa: "👕", camisa: "👔", pantalón: "👖", zapato: "👟", vestido: "👗",
  chaqueta: "🧥", abrigo: "🧥", gafas: "👓",
  // Haus & Stadt
  casa: "🏠", cocina: "🍳", cama: "🛏️", sofá: "🛋️", llave: "🔑", puerta: "🚪",
  ventana: "🪟", mesa: "🪑", silla: "🪑", jardín: "🌷", edificio: "🏢", piso: "🏢",
  tienda: "🏬", mercado: "🛒", banco: "🏦", iglesia: "⛪", parque: "🌳",
  restaurante: "🍴", bar: "🍸", museo: "🏛️", hospital: "🏥", farmacia: "💊",
  escuela: "🏫", oficina: "🏢", ciudad: "🏙️", calle: "🛣️", baño: "🚻", luz: "💡",
  // Reise & Verkehr
  coche: "🚗", auto: "🚗", tren: "🚆", avión: "✈️", autobús: "🚌", metro: "🚇",
  taxi: "🚕", bicicleta: "🚲", barco: "⛴️", maleta: "🧳", mapa: "🗺️", billete: "🎫",
  puente: "🌉", estación: "🚉", aeropuerto: "🛫", hotel: "🏨",
  // Gegenstände & Alltag
  teléfono: "📞", móvil: "📱", dinero: "💶", libro: "📖", reloj: "⏰", ordenador: "💻",
  música: "🎵", juego: "🎮", película: "🎬", carta: "✉️", regalo: "🎁", flor2: "🌹",
  // Personen & Familie
  hombre: "👨", mujer: "👩", niño: "👦", niña: "👧", bebé: "👶", familia: "👨‍👩‍👧",
  madre: "👩", padre: "👨", amigo: "🧑‍🤝‍🧑", médico: "🧑‍⚕️", profesor: "🧑‍🏫",
  policía: "👮", rey: "🤴",
  // Zeit & Wetter
  día: "📅", noche: "🌙", año: "📆", calor: "🥵", frío: "🥶", tiempo: "⏳",
  // Zahlen/Farben-Anker (visuell)
  rojo: "🟥", azul: "🟦", verde: "🟩", amarillo: "🟨", negro: "⬛", blanco: "⬜",
  // Weitere konkrete Begriffe (kommen auch in der großen Liste vor)
  luna: "🌙", estrella: "⭐", nube: "☁️", tormenta: "⛈️", hielo: "🧊", isla: "🏝️",
  bosque: "🌲", campo: "🌾", piedra: "🪨", oro: "🥇", plata: "🥈", llave2: "🗝️",
  puerta2: "🚪", coche2: "🚙", moto: "🏍️", camión: "🚚", policía2: "🚓", ambulancia: "🚑",
  guitarra: "🎸", piano: "🎹", cámara: "📷", televisión: "📺", radio: "📻", ordenador2: "🖥️",
  teléfono2: "☎️", carta2: "📩", periódico: "📰", bolígrafo: "🖊️", lápiz: "✏️", papel: "📄",
  tijeras: "✂️", martillo: "🔨", cuchillo: "🔪", tenedor: "🍴", cuchara: "🥄", plato: "🍽️",
  vaso: "🥛", botella: "🍾", taza: "☕", pastel: "🍰", chocolate: "🍫", galleta: "🍪",
  helado: "🍦", caramelo: "🍬", miel: "🍯", mantequilla: "🧈", limón: "🍋", fresa: "🍓",
  uva: "🍇", sandía: "🍉", piña: "🍍", cereza: "🍒", melocotón: "🍑", coco: "🥥",
  zanahoria: "🥕", maíz: "🌽", cebolla: "🧅", ajo: "🧄", champiñón: "🍄", pimiento: "🫑",
  pollo: "🍗", jamón: "🥓", hamburguesa: "🍔", pizza: "🍕", perrito: "🌭", taco: "🌮",
  caballo: "🐎", vaca: "🐄", cerdo: "🐖", oveja: "🐑", cabra: "🐐", conejo: "🐇",
  ratón: "🐁", oso: "🐻", león: "🦁", tigre: "🐅", elefante: "🐘", mono: "🐒",
  serpiente: "🐍", pájaro: "🐦", águila: "🦅", búho: "🦉", pato: "🦆", gallina: "🐔",
  abeja: "🐝", mariposa: "🦋", araña: "🕷️", tortuga: "🐢", rana: "🐸", delfín: "🐬",
  ballena: "🐳", tiburón: "🦈", pulpo: "🐙", cangrejo: "🦀", caracol: "🐌",
  reloj2: "⌚", anillo: "💍", corona: "👑", sombrero: "🎩", bolso: "👜", paraguas: "☂️",
  pelota: "⚽", balón: "🏀", raqueta: "🎾", bicicleta2: "🚴", trofeo: "🏆", medalla: "🎖️",
  cohete: "🚀", satélite: "🛰️", ancla: "⚓", brújula: "🧭", tienda2: "⛺", fuego2: "🔥",
  bombilla: "💡", batería: "🔋", enchufe: "🔌", imán: "🧲", termómetro: "🌡️", jeringa: "💉",
  píldora: "💊", venda: "🩹", microscopio: "🔬", telescopio: "🔭", globo: "🎈", regalo2: "🎁",
  vela: "🕯️", campana: "🔔", tambor: "🥁", trompeta: "🎺", violín: "🎻", micrófono: "🎤",
  auricular: "🎧", disco: "💿", dado: "🎲", ajedrez: "♟️", naipe: "🃏", diana: "🎯",
  ojo2: "👁️", pie2: "🦶", hueso: "🦴", cerebro: "🧠", músculo: "💪", lengua: "👅",
  sangre2: "🩸", diente2: "🦷", esqueleto: "💀", fantasma: "👻", robot: "🤖", extraterrestre: "👽",
  árbol2: "🌲", hoja: "🍁", cactus: "🌵", seta: "🍄", trébol: "🍀", rosa2: "🌹",
  tulipán: "🌷", girasol: "🌻", semilla: "🌱", tierra2: "🌍", volcán: "🌋", desierto: "🏜️",
  puente2: "🌉", castillo: "🏰", fábrica: "🏭", granja: "🏡", carpa: "🎪",
  // Berufe & Personen
  bombero: "🧑‍🚒", cocinero: "🧑‍🍳", agricultor: "🧑‍🌾", científico: "🧑‍🔬", juez: "🧑‍⚖️",
  cantante: "🧑‍🎤", pintor: "🧑‍🎨", piloto: "🧑‍✈️", astronauta: "🧑‍🚀", enfermera: "🧑‍⚕️",
  soldado: "🪖", ladrón: "🦹", mago: "🧙", hada: "🧚", ángel: "👼", bebé2: "👶",
  abuelo: "👴", abuela: "👵", novio: "🤵", novia2: "👰",
  // Aktivitäten / Sport
  correr2: "🏃", nadar: "🏊", bailar: "💃", saltar: "🤸", esquí: "⛷️", surf: "🏄",
  fútbol: "⚽", tenis: "🎾", golf: "⛳", boxeo: "🥊", yoga: "🧘", pesca: "🎣",
  // Werkzeuge & Haushalt
  llave3: "🔧", destornillador: "🪛", sierra: "🪚", pala: "🥄", escoba: "🧹",
  jabón: "🧼", esponja: "🧽", cubo: "🪣", cepillo: "🪥", peine: "💈", espejo: "🪞",
  vela2: "🕯️", linterna: "🔦", candado: "🔒", cadena: "⛓️", cuerda: "🧵", aguja: "🪡",
  // Essen erweitert
  fideos: "🍜", sushi: "🍣", gamba: "🦐", ostra: "🦪", croissant: "🥐", baguette: "🥖",
  panqueque: "🥞", donut: "🍩", cupcake: "🧁", flan: "🍮", palomitas: "🍿", nuez: "🌰",
  aguacate: "🥑", brócoli: "🥦", pepino: "🥒", chile: "🌶️", castaña: "🌰", pera: "🍐",
  mango: "🥭", kiwi: "🥝", cóctel: "🍸", whisky: "🥃", champán: "🍾",
  // Natur & Wetter erweitert
  arcoíris: "🌈", relámpago: "⚡", gota: "💧", ola: "🌊", cascada: "🏞️", cueva: "🕳️",
  seta2: "🍄", palmera: "🌴", bambú: "🎋", roca: "🪨", concha: "🐚", pluma: "🪶",
  // Gegenstände erweitert
  llavero: "🔑", monedero: "👛", mochila: "🎒", maletín: "💼", paraguas2: "🌂",
  gorra: "🧢", corbata: "👔", bufanda: "🧣", guante: "🧤", calcetín: "🧦", bikini: "👙",
  reloj3: "🕰️", balanza: "⚖️", lámpara: "🪔",
  llave4: "🗝️", trofeo2: "🏆", diamante: "💎", moneda: "🪙", billete2: "💵", tarjeta: "💳",
  // Musik & Kunst
  saxofón: "🎷", acordeón: "🪗", banjo: "🪕", maracas: "🪇", nota: "🎶",
  pincel: "🖌️", paleta: "🎨", marco: "🖼️", teatro: "🎭", cine: "🎬", entrada: "🎟️",
  // Transport erweitert
  tractor: "🚜", grúa: "🏗️", tren2: "🚂", tranvía: "🚊", helicóptero: "🚁", cohete2: "🚀",
  velero: "⛵", canoa: "🛶", globo2: "🎈", trineo: "🛷", monopatín: "🛹", scooter: "🛴",
};
