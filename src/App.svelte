<svelte:head>
  <!-- <script src="./midi_player/build/MIDI.js" type="text/javascript" on:load={scriptLoaded}></script> -->
  <script src="./midi_player/build/MIDI.js" on:load={scriptLoaded} lang="ts"></script>
  <!-- shims -->
  <!-- <script src="./midi_player/inc/shim/Base64.js" type="text/javascript"></script> -->
  <script src="./midi_player/inc/shim/Base64binary.js" type="text/javascript" on:load={scriptLoaded}></script>
  <!-- <script src="./midi_player/inc/shim/WebAudioAPI.js" type="text/javascript"></script> -->
  <!-- midi.js -->
  <!-- <script src="./midi_player/js/midi/audioDetect.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/midi/gm.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/midi/loader.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/midi/plugin.audiotag.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/midi/plugin.webaudio.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/midi/plugin.webmidi.js" type="text/javascript"></script> -->
  <!-- utils -->
  <!-- <script src="./midi_player/js/util/dom_request_xhr.js" type="text/javascript"></script> -->
  <!-- <script src="./midi_player/js/util/dom_request_script.js" type="text/javascript"></script> -->
</svelte:head>

<script>
// @ts-nocheck
  import { Midi } from '@tonejs/midi'
  import { onMount } from 'svelte'
  import RangeSlider from "svelte-range-slider-pips";

  // import './midi_player/inc/shim/Base64'
  // import './assets/js/MIDI.js'
  // import './assets/js/Base64binary.js'

  let files, transpose, currentMidi, buffer = [], tickDuration = 0.0001, tickDurationInMilis = 1, currentNote, notes = [...Array(96).keys()];
  let fieldStart = 0, fieldEnd = 86, fieldTime = 1000, blockBuffer= [], blockMap = new Map(), scriptsLoaded = 0;
  let whiteNoteWidth = 1.785, blackNoteWidth = 1.2;
  let blackNoteIndex = [1,3,5,8,10], whiteNotesFirstGroup = [3,5,7];
  let blockContainer;
  let tracks = [];
  let channelVolumes = [];
	let values = [50]
  let tempoSlider = 1

  $: if (files) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log("File has been uploaded", files);
    parseFile(files[0])
	}

  $: if (values) {
    for (let key of blockMap.keys()) {
      notePressed(key, false)
    }

    blockMap = new Map();
  }

  function scriptLoaded() {
    if (scriptsLoaded == 0) {
      scriptsLoaded++;
    } else {
      loadPlugin()
    }
  }

  onMount(async () => {
    //loadPlugin();
  });

  function loadPlugin() {
    console.log("Loading plugin")
    MIDI.loadPlugin({
      soundfontUrl: "./midi_player/examples/soundfont/",
      instrument: [0,0,0,0,0],
      onprogress: function(state, progress) {
        //tracks = MIDI.tracks;

        if (tracks && tracks.length > 0) {
          for (let i = 0; i < tracks.length; i++) {
            channelVolumes.push([50])
          }
        }

        for (let i = 0; i < 5; i++) {
          MIDI.channels[i].instrument = 0
        }
      },
      onsuccess: function() {
        // play the note
        MIDI.setVolume(0, 127);
        MIDI.setVolume(1, 127);
        MIDI.setVolume(2, 127);
        MIDI.setVolume(3, 127);
        MIDI.setVolume(4, 127);
      }
    });
  }

  function parseFile(file) {
    //read the file
    const reader = new FileReader();
    reader.onload = function (e) {
      const midi = new Midi(e.target.result);
      currentMidi = midi;
      tracks = currentMidi.tracks;

      for (let i = 0; i < tracks.length; i++) {
        channelVolumes.push(100);
      }

      console.log("Current midi", currentMidi)

      playFile();
    };
    reader.readAsArrayBuffer(file);
  }

  function playFile() {    
    for (let i = 0; i < currentMidi.tracks.length; i++) {
      setTimeout(function() {
        generateNewBlock(0,i)
      }, currentMidi.tracks[i].notes[0].ticks * tickDurationInMilis)
    }

    // setTimeout(function() {
    //   generateNewBlock(0,0)
    // }, currentMidi.tracks[0].notes[0].ticks * tickDurationInMilis)
  }

  function generateNewBlock(index, track) {
    if (index >= currentMidi.tracks[track].length) {
      return;
    }

    let notes = currentMidi.tracks[track].notes

    let pressedNote = document.getElementById("note0")

    if (isWhiteNote(notes[index].midi)) {
      pressedNote.classList.add("white_note_pressed");
    } else {
      pressedNote.classList.add("black_note_pressed");
    }

    notePressed(notes[index].midi + values[0] - 50, true, track, notes[index].velocity, 0);

    // release the note
    setTimeout(function() {
      notePressed(notes[index].midi + values[0] - 50, false, track);
    }, (notes[index].durationTicks) * tickDurationInMilis)

    // play next tone
    if (index < notes.length - 1) {
      setTimeout(function() {
        generateNewBlock(index + 1, track)
      }, (notes[index + 1].ticks - notes[index].ticks) * tickDurationInMilis)
    }
  }

  function notePressed(index, pressDown, channel = 0, velocity = 10, delay = 0) {
    console.log(channelVolumes)
    let trueVelocity = channelVolumes.length > 0 ? velocity * (channelVolumes[channel] / 100) : velocity;
    if (pressDown) {
      let testingId = guidGenerator();
      let startTime = new Date().getTime();

      const block = document.createElement('div');
      block.textContent = '.'

      // width
      block.setAttribute(
        'style',
        'width: ' + calculateBlockWidth(index) + 'vw; left: ' + calculateBlockPosition(index) + 'vw; opacity:' + trueVelocity + ';'
      );

      // class
      block.setAttribute(
        'class',
        'block'
      );

      // id
      block.setAttribute(
        'id',
        testingId
      );

      blockContainer.appendChild(block)

      const el = document.getElementById(testingId)
      el.animate([
        { transform: 'translateY(-860vh)' }
      ],{
        // timing options
        duration: fieldTime * 10,
        iterations: 1
      })

      blockMap.set(index, {element: el, startTime: startTime})

      MIDI.noteOn(channel, index + 21, trueVelocity, delay);  

    } else {
      let endTime = new Date().getTime();
      let block = blockMap.get(index);
      //console.log(index)
      let el = block.element;
      let startTime = block.startTime;
      

      let height = (endTime - startTime) / fieldTime * fieldEnd;
      el.style.clip = "rect(0px,100vw," + height + "vh,0px)";

      blockMap.delete(index)

      MIDI.noteOff(channel, index + 21, 0);  

      setTimeout(function() {el.remove()}, fieldTime)
    }
  }

  function calculateBlockPosition(index) {
    let width = Math.floor(index / 12) * 7 * whiteNoteWidth;

    switch (index % 12) {
      case 1:
        width += (whiteNoteWidth - blackNoteWidth / 2)
        break;
      case 2: 
        width += whiteNoteWidth
        break;
      case 3: 
        width += (2 * whiteNoteWidth - blackNoteWidth / 2)
        break;
      case 4:
        width += 2 * whiteNoteWidth
        break;
      case 5:
        width += (3 * whiteNoteWidth - blackNoteWidth / 2)
        break;
      case 6:
        width += 3 * whiteNoteWidth;
        break;
      case 7: 
        width += 4 * whiteNoteWidth
        break;
      case 8: 
        width += (5 * whiteNoteWidth - blackNoteWidth / 2)
        break;
      case 9:
        width += 5 * whiteNoteWidth
        break;
      case 10: 
        width += (6 * whiteNoteWidth - blackNoteWidth / 2)
        break;
      case 11: 
        width += 6 * whiteNoteWidth
        break;
      default:
        width += 0;
    }

    return width;
  }

  function calculateBlockWidth(index) {
    if (blackNoteIndex.includes(index % 12)) {
      return blackNoteWidth
    } else {
      return whiteNoteWidth
    }
  }

  function isWhiteNote(index) {
    if (blackNoteIndex.includes(index % 12)) {
      return false
    } else {
      return true
    }
  }

  function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }
</script>

<main>

  <div class="row">
    <div class="container col">
      <div class="row">
        <h1>Midi Visualizer</h1>
      </div>
  
      <div class="row">
        <p class="read-the-docs">
          Visualizing MIDI tracks
        </p>
      </div>    
    
      <div class="row">
        <div class="col">
          <input
            bind:files
            id="filereader"
            name="midifilereader"
            type="file"
          />
        </div>
      </div>
    </div>
    <div class="col mt-3 pr-5 pl-5">
      <div>
        Transpose
      </div>
      <div class="row rangeSliderMargin">
        <RangeSlider bind:values pips all="label" />
      </div>
      <div>
        Tempo
      </div>
      <div class="row rangeSliderMargin">
        <input type="range" class="form-range" id="customRange" min="0.1" max="10" step="0.01" bind:value={tickDurationInMilis}>
      </div>
      <div class="row">
        {#each tracks as channel, i}
        <div class="col">
          <input type="range" class="form-range" id="customRange1" bind:value={channelVolumes[i]} orient="vertical">
          <label for="customRange1" class="form-label">Channel {i + 1} volume</label>
        </div>
          <!-- <RangeSlider bind:channelVolumes[i] pips vertical=true /> -->
        {/each}
      </div>
    </div>
  </div>

  <div bind:this={blockContainer}>

  </div>

  <div class="fullWidth fixed-bottom">
    <ul class="set">
      {#each notes as note, i}
        {#if i % 12 == 0}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white b"></li>
        {:else if i % 12 == 1}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="black as"></li>
        {:else if i % 12 == 2}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white a"></li>
        {:else if i % 12 == 3}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="black gs"></li>
        {:else if i % 12 == 4}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white g"></li>
        {:else if i % 12 == 5}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="black fs"></li>
        {:else if i % 12 == 6}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white f"></li>
        {:else if i % 12 == 7}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white e"></li>
        {:else if i % 12 == 8}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="black ds"></li>
        {:else if i % 12 == 9}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white d"></li>
        {:else if i % 12 == 10}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="black cs"></li>
        {:else}
        <li on:mousedown={() => {notePressed(i, true)}} on:mouseup={() => {notePressed(i, false)}} id="note{i}" tabIndex="{i}" class="white c"></li>
        {/if}
      {/each}
    </ul>
  
    
    </div>

</main>
<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }

  :root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  /* display: flex; */
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

.card {
  padding: 2em;
}

#app {
  margin: 0;
  /* padding: 2rem; */
  text-align: center;
  height: 100vh;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}

.fullWidth {
  width: 100%;
  /* background-color: red; */
  float: bottom;
}

.block {
  background-color: red;
  /* width: 1vw; */
  position: absolute;
  bottom: -986vh;
  height: 1000vh;
}

.translate {
  transition: translate 1s;
  transition-timing-function: linear;
  translate: 0px -86vh;
}

.form-range {
  margin-right: 3rem;
}

.rangeSliderMargin {
  margin-right: 3rem;
}

input[type=range][orient=vertical]
{
    writing-mode: bt-lr; /* IE */
    -webkit-appearance: slider-vertical; /* Chromium */
    width: 8px;
    height: 175px;
    padding: 0 5px;
}
</style>
