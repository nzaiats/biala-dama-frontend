/**
 * view-data.js — Dworek Biała Dama
 * All static data constants:
 *   MENU_CATEGORIES, MENU_DATA, HALLS_DATA,
 *   ATTRACTIONS_DATA, HOTEL_PRICES
 * Must be loaded before view-public.js and view-manager.js.
 */

/**
 * view.js — Dworek Biała Dama
 * Full UI logic: menu, reservation flow, manager panel, DB layer
 */

// ============================================================
// === RESTAURANT / MENU DATA
// ============================================================

const MENU_CATEGORIES = [
    { key: 'zupy',         label: 'Zupy',                          en: 'Soups' },
    { key: 'zimne',        label: 'Zimne Przekąski',               en: 'Cold Appetizers' },
    { key: 'wolowina',     label: 'Dania z Wołowiny',              en: 'Beef Courses' },
    { key: 'wieprzowina',  label: 'Dania z Wieprzowiny',           en: 'Pork Courses' },
    { key: 'regionalne',   label: 'Dania Regionalne',              en: 'Regional Specialties' },
    { key: 'drob',         label: 'Dania z Drobiu',                en: 'Poultry Courses' },
    { key: 'pierogi',      label: 'Pierogi / Makarony / Naleśniki',en: 'Dumplings / Pasta / Pancakes' },
    { key: 'dziczyzna',    label: 'Dania z Dziczyzny',             en: 'Venison Courses' },
    { key: 'ryby',         label: 'Ryby',                          en: 'Fish' },
    { key: 'salatki',      label: 'Sałatki',                       en: 'Salads' },
    { key: 'desery',       label: 'Desery',                        en: 'Desserts' },
    { key: 'dodatki',      label: 'Dodatki',                       en: 'Side Dishes' },
];

const MENU_DATA = [
    // Zupy
    { id:1,  cat:'zupy',        name:'Zupa leśniczego: podgrzybkowo-borowikowa z łazankami', en:"Forester's soup: mushroom soup with flat noodles", price:21, unit:'porcja 250g',  emoji:'🍲' },
    { id:2,  cat:'zupy',        name:'Zupa pomidorowa z domowym makaronem',                  en:'Tomato soup with pasta',                             price:19, unit:'porcja 250ml', emoji:'🍅' },
    { id:3,  cat:'zupy',        name:'Rosół z kaczki i domowym makaronem',                   en:'Duck broth with pasta',                              price:16, unit:'porcja 250ml', emoji:'🥣' },
    { id:4,  cat:'zupy',        name:'Chłodnik z jajkiem (sezonowo)',                        en:'Cold vegetable soup with egg – seasonal',            price:19, unit:'porcja 250ml', emoji:'🥗' },
    { id:5,  cat:'zupy',        name:'Barszcz biały z jajkiem i wędzonką',                   en:'White borscht with smoked bacon and egg',            price:19, unit:'porcja 250ml', emoji:'🥣' },
    { id:6,  cat:'zupy',        name:'Czernina na kwaśno z domowym makaronem',               en:'Duck blood soup',                                    price:22, unit:'porcja 250ml', emoji:'🍵' },

    // Zimne Przekąski
    { id:7,  cat:'zimne',       name:'Tatar wołowy z marynowanymi grzybkami, ogórkiem kiszonym, cebulką i kaparami', en:'Raw beef Tatar with mushrooms, onion and capers', price:36, unit:'porcja 120g', emoji:'🥩' },
    { id:8,  cat:'zimne',       name:'Śledzie po staropolsku (w oleju z cebulką)',           en:'Herring in old Polish style',                        price:16, unit:'porcja 150g', emoji:'🐟' },
    { id:9,  cat:'zimne',       name:'Śledzie w śmietanie',                                  en:'Herring in cream',                                   price:18, unit:'porcja 150g', emoji:'🐟' },
    { id:10, cat:'zimne',       name:'Smalec z kaczki z kawałkami mięsa, pieczywem i ogórkiem kiszonym', en:'Lard with roasted duck, country bread and pickled cucumber', price:16, unit:'porcja 20g', emoji:'🍞' },

    // Dania z wołowiny
    { id:11, cat:'wolowina',    name:'Zrazy wołowe pod cebulką duszone w piwie',             en:'Beef chops stewed in beer',                          price:34, unit:'porcja 400g', emoji:'🥩' },
    { id:12, cat:'wolowina',    name:'Ozorek wołowy w sosie chrzanowo-śmietanowym',           en:'Beef tongue in horseradish and cream sauce',         price:32, unit:'porcja 200g', emoji:'🥩' },
    { id:13, cat:'wolowina',    name:'Medaliony wołowe (poliki) z warzywami w sosie własnym', en:'Beef medallions in gravy with vegetables',           price:38, unit:'porcja 400g', emoji:'🥩' },

    // Dania z wieprzowiny
    { id:14, cat:'wieprzowina', name:'Kotlet schabowy z jajkiem sadzonym',                   en:'Porkchop with fried egg',                            price:24, unit:'porcja 160g', emoji:'🐖' },
    { id:15, cat:'wieprzowina', name:'Schab duszony w sosie śmietanowo-kurkowym',             en:'Stewed porkchop in cream-chanterelle sauce',         price:30, unit:'porcja 200g', emoji:'🐖' },
    { id:16, cat:'wieprzowina', name:'Polędwiczki w sosie z rozmarynem i suszonymi pomidorami',en:'Pork tenderloin with rosemary and sun-dried tomatoes sauce', price:30, unit:'porcja 200g', emoji:'🐖' },
    { id:17, cat:'wieprzowina', name:'Golonka (bez kości) pieczona podawana z chrzanem i musztardą', en:'Knuckle of pork (boneless), roasted with horseradish and mustard', price:16, unit:'wg wagi 100g (~48 zł)', emoji:'🐷' },
    { id:18, cat:'wieprzowina', name:'Placki ziemniaczane z gulaszem',                       en:'Potato pancakes with meat goulash',                  price:40, unit:'5 szt.',       emoji:'🥞' },

    // Dania regionalne
    { id:19, cat:'regionalne',  name:'Zalewajka na własnym zakwasie podawana z razowym pieczywem', en:'"Zalewajka" sour soup with homemade sourdough starter', price:20, unit:'porcja 250ml', emoji:'🥣' },
    { id:20, cat:'regionalne',  name:'Zalewajka wegańska z ziemniakami',                     en:'"Zalewajka" vegan stew with potatoes',                price:20, unit:'porcja 250ml', emoji:'🥣' },
    { id:21, cat:'regionalne',  name:'Kluski "żelazne" z wędzonym twarogiem',                en:'"Żelazne" noodles with smoked cheese curd',          price:35, unit:'porcja 350g', emoji:'🥟' },
    { id:22, cat:'regionalne',  name:'Kluski "żelazne" z marynowanym twarogiem z tofu',      en:'"Żelazne" noodles with pickled tofu curd',           price:35, unit:'porcja 350g', emoji:'🥟' },

    // Dania z drobiu
    { id:23, cat:'drob',        name:'„Złota Kaczka" (noga) marynowana w miodzie, imbirze i czosnku z duszoną kapustą i morelami', en:'"Golden Duck" marinated in honey, ginger and garlic with stewed red cabbage and apricots', price:34, unit:'porcja 180g', emoji:'🦆' },
    { id:24, cat:'drob',        name:'Roladki z piersi kaczki w sosie grzybowym',             en:'Duck breast rolls in mushroom sauce',                price:36, unit:'porcja 280g', emoji:'🦆' },
    { id:25, cat:'drob',        name:'Pieczona kaczka (noga) z gorącym jabłuszkiem nadziewanym żurawiną', en:'Roasted duck (leg) with hot cranberry-stuffed apple', price:33, unit:'porcja 200g', emoji:'🦆' },
    { id:26, cat:'drob',        name:'Duszone kacze żołądki',                                en:'Braised duck stomachs',                              price:30, unit:'porcja 220g', emoji:'🦆' },
    { id:27, cat:'drob',        name:'Filet drobiowy panierowany',                           en:'Breaded chicken fillet',                             price:20, unit:'porcja 160g', emoji:'🍗' },

    // Pierogi / Makarony / Naleśniki
    { id:28, cat:'pierogi',     name:'Pierogi z kaczką podawane z cebulką — obsmażane lub z wody', en:'Dumplings with duck – fried or boiled',           price:42, unit:'6 szt.', emoji:'🥟' },
    { id:29, cat:'pierogi',     name:'Pierogi z kapustą i grzybami zebranymi w Puszczy Bolimowskiej', en:'Pierogi with sauerkraut and mushroom filling (mushrooms from Bolimowska Forest)', price:32, unit:'6 szt.', emoji:'🥟' },
    { id:30, cat:'pierogi',     name:'Pierogi z mięsem — obsmażane lub z wody',              en:'Meat dumplings – fried or boiled',                   price:30, unit:'6 szt.', emoji:'🥟' },
    { id:31, cat:'pierogi',     name:'Pierogi ruskie — obsmażane lub z wody',                en:'Dumplings in Russian style with white cheese, potatoes and onion', price:29, unit:'6 szt.', emoji:'🥟' },
    { id:32, cat:'pierogi',     name:'Makaron kokardki z sosem szpinakowym i wędzonym łososiem', en:'Pasta bows with spinach sauce and smoked salmon',  price:35, unit:'porcja 250g', emoji:'🍝' },
    { id:33, cat:'pierogi',     name:'Naleśnik z białym serem / dżemem, bitą śmietaną i polewą czekoladową', en:'Pancake with white cheese / jam, whipped cream and chocolate glaze', price:10, unit:'1 szt.', emoji:'🥞' },
    { id:34, cat:'pierogi',     name:'Placki ziemniaczane z cukrem',                         en:'Potato pancake with sugar',                          price:28, unit:'5 szt.', emoji:'🥞' },

    // Dania z dziczyzny
    { id:35, cat:'dziczyzna',   name:'Pieczeń z jelenia marynowanego Żubrówką w sosie z zielonego pieprzu', en:'Roast deer in Żubrówka marinade with green pepper sauce', price:48, unit:'porcja 160g', emoji:'🦌' },
    { id:36, cat:'dziczyzna',   name:'Filet z sarny w sosie borowikowym',                    en:'Roe fillet in boletus sauce',                        price:53, unit:'porcja 200g', emoji:'🦌' },
    { id:37, cat:'dziczyzna',   name:"Gulasz z dzika a'la Radziwiłł",                        en:'Stew from wild boar',                                price:42, unit:'porcja 250g', emoji:'🐗' },

    // Ryby
    { id:38, cat:'ryby',        name:'Dorsz — filet w sosie porowym',                        en:'Cod fillet in leek sauce',                           price:12, unit:'wg wagi 100g (~35 zł)', emoji:'🐟' },
    { id:39, cat:'ryby',        name:'Łosoś — filet smażony lub pieczony',                   en:'Salmon fillet – fried or baked',                     price:19, unit:'wg wagi 100g (~38 zł)', emoji:'🐟' },

    // Sałatki
    { id:40, cat:'salatki',     name:'Sałatka z pieczonym kurczakiem, sałatą lodową i prażonymi pestkami dyni', en:'Salad with roasted chicken, iceberg lettuce and baked pumpkin seeds', price:30, unit:'porcja 350g', emoji:'🥗' },
    { id:41, cat:'salatki',     name:'Sałatka z tofu marynowanym w pesto z liści rzodkiewki i bazylii', en:'Salad with tofu marinated in radish leaf and basil pesto', price:30, unit:'porcja 350g', emoji:'🥗' },
    { id:42, cat:'salatki',     name:'Pieczona pierś z kaczki podawana z filetowaną pomarańczą i malinowym winegretem (na zimno)', en:'Salad with roasted duck breast, oranges and raspberry vinaigrette', price:36, unit:'porcja 320g', emoji:'🥗' },

    // Desery
    { id:43, cat:'desery',      name:'Deser lodowy śmietankowo-czekoladowy z owocami sezonowymi', en:'Creamy and chocolate ice cream sundae with fruit', price:18, unit:'porcja 150g', emoji:'🍨' },
    { id:44, cat:'desery',      name:'Domowa szarlotka na ciepło z lodami i bitą śmietaną',   en:'Hot apple pie with ice cream and whipped cream',    price:22, unit:'porcja 250g', emoji:'🍎' },
    { id:45, cat:'desery',      name:'Ciasto domowe (informacja u kelnera)',                  en:'Homemade cake (ask the waiter)',                     price:14, unit:'porcja',      emoji:'🎂' },
    { id:46, cat:'desery',      name:'Deser Pani Orzelska — Biała Dama (mus czekoladowy, mandarynki, wafelek czekoladowo-orzechowy, bita śmietana)', en:'Dessert Ms. Orzelska – White Lady: chocolate mousse, tangerines, wafer, whipped cream', price:20, unit:'porcja 150g', emoji:'🍮' },
    { id:47, cat:'desery',      name:'Puchar owocowy z bitą śmietaną',                        en:'Fruit cup with whipped cream',                      price:20, unit:'porcja 150g', emoji:'🍓' },

    // Dodatki
    { id:48, cat:'dodatki',     name:'Ziemniaki gotowane z koperkiem',                       en:'Boiled potatoes with dill',                          price:8,  unit:'porcja 200g', emoji:'🥔' },
    { id:49, cat:'dodatki',     name:'Ziemniaki purée z koperkiem',                          en:'Mashed potatoes with dill',                          price:10, unit:'porcja 200g', emoji:'🥔' },
    { id:50, cat:'dodatki',     name:'Kasza gryczana',                                       en:'Buckwheat',                                          price:8,  unit:'porcja 200g', emoji:'🌾' },
    { id:51, cat:'dodatki',     name:'Mini kopytka (białe i szpinakowe)',                     en:'Mini potato dumplings – white or spinach',           price:10, unit:'porcja 200g', emoji:'🥟' },
    { id:52, cat:'dodatki',     name:'Frytki',                                               en:'French fries',                                       price:12, unit:'porcja 200g', emoji:'🍟' },
    { id:53, cat:'dodatki',     name:'Kapusta zasmażana z kminkiem (sezonowo kapusta młoda)', en:'Fried cabbage with caraway seeds (seasonal: young cabbage)', price:8, unit:'porcja 200g', emoji:'🥬' },
];

const HALLS_DATA = [
    { id: 'kominkowa', name: 'Sala «Złota Paproć»', desc: 'Elegancka sala restauracyjna z barem, pełna złotych dekoracji i mebli vintage. Przytulny klimat, wyjątkowa atmosfera.', capacity: 40, img: 'photos/zlota.png' },
    { id: 'lesna',     name: 'Sala Zielona',        
          desc: 'Mała, kameralna sala z widokiem na pałac. Tylko 4 stoliki — idealna na spokojny, pyszny posiłek.', capacity: 20, img: 'photos/lesna.png' },
    { id: 'taras',     name: 'Taras Letni',           desc: 'Słoneczny taras w wewnętrznej części restauracji, otoczony bujną roślinnością. Świeże powietrze i zieleń na wyciągnięcie ręki.', capacity: 20, img: 'photos/taras.png' },
];

const ATTRACTIONS_DATA = [
    { name: 'Pałac Radziwiłłów',               desc: 'Jeden z najpiękniejszych barokowych pałaców w Polsce z zabytkowym parkiem angielskim.',    dist: '300 m od Dworku',      emoji: '🏛️' },
    { name: 'Ogród Romantyczny w Arkadii',      desc: 'Wyjątkowy park krajobrazowy z XVIII-wieczną architekturą i rzeźbami wśród natury.',         dist: '4 km od Dworku',       emoji: '🌿' },
    { name: 'Bolimowski Park Krajobrazowy',      desc: 'Rozległy park z trasami spacerowymi, rowerowymi i miejscami do obserwacji ptaków.',         dist: '5 km od Dworku',       emoji: '🌲' },
    { name: 'Spływ kajakowy rzeką Bzurą',       desc: 'Niezapomniane spływy kajakowe — rzeka Bzura przepływa 3 km na północ od Dworku.',           dist: '3 km od Dworku',       emoji: '🛶' },
    { name: 'Muzeum w Łowiczu',                 desc: 'Muzeum poświęcone tradycjom ludowym Mazowsza — wycinanki, stroje i folklor regionu.',        dist: '15 km od Dworku',      emoji: '🎨' },
    { name: 'Łódź — miasto kultury i rozrywki', desc: 'Drugie co do wielkości miasto Polski z bogatą ofertą kulturalną, restauracyjną i muzyczną.', dist: '40 km od Dworku',      emoji: '🏙️' },
];

const HOTEL_PRICES = [
    { persons:'🧍', title:'Pokój Jednoosobowy', subtitle:'Dla 1 osoby', price:195, featured:false, includes:['Śniadanie w cenie','Parking gratis','Wi-Fi & TV'] },
    { persons:'👫', title:'Pokój Dwuosobowy',   subtitle:'Dla 2 osób',  price:265, featured:true,  includes:['Śniadanie dla 2 os.','Parking gratis','Wi-Fi & TV'] },
    { persons:'👨‍👩‍👦', title:'Apartament',          subtitle:'Dla 3 osób',  price:345, featured:false, includes:['Śniadanie dla 3 os.','Parking gratis','Wi-Fi & TV','Balkon'] },
    { persons:'👨‍👩‍👧‍👦', title:'Apartament Rodzinny', subtitle:'Dla 4 osób',  price:395, featured:false, includes:['Śniadanie dla 4 os.','2 miejsca parkingowe','Wi-Fi & TV'] },
];


// ============================================================