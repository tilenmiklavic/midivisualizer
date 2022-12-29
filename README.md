# Midi Visualizer 🎵

Aplikacija za vizualizacijo igranih tonov na klaviarturo. Omogoča igranje in sprotno vizualizacijo in nalaganje datotek za lažjo uporabo. 
Uporabnik lahko med splemljenjem glasbe iz datoteke spreminja višino igranih tonov, upravlja z glasnostjo vsakega kanala posebej in spreminja hitrost igrane glasbe.

Med uporabo lahko spremljemo igrane tone, ravno tako pa njihovo dolžino in glasnost (glede na prosojnost prikazanih blokov). 

## Uporaba
🚧 Aplikacija je dostopna na: [Demo](midivisualizer.vercel.app) 🚧
Z uporabo gumba za nalaganje datoteke izberi lokalno MIDI datoteko in jo izberi. Po uspešnjem nalaganju se bo skladba samodejno začela predvajati.
 
Uporabi drsnik `Transpose` za spreminjanje višine igranih tonov. 
Uporabi drsnik `Tempo` za spreminjanje hitrosti igrane glasbe. 
Uporabi drsnike `Channel # volume` za spreminjanje glasnosti posamičnih kanalov. 
## Namestitev 
Za lokalno namestitev in uporabo:

- ustavi kopijo GitHub repozitorija: `git clone https://github.com/tilenmiklavic/midivisualizer.git`
- navigiraj v datoteko projekta
- `npm install`
- `npm run dev`
- v primeru težav poskusi `npm i svelte` in potem poskusi ponovno
