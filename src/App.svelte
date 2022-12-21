<script>
// @ts-nocheck
  import { Midi } from '@tonejs/midi'
  import { onMount } from 'svelte'
  import RangeSlider from "svelte-range-slider-pips";

  let files, transpose, currentMidi, buffer = [], tickDuration = 0.0015, tickDurationInMilis = 1.5, currentNote, notes = [...Array(96).keys()];
  let fieldStart = 0, fieldEnd = 86, fieldTime = 1000, blockBuffer= [], blockMap = new Map();
  let whiteNoteWidth = 1.785, blackNoteWidth = 1.2;
  let blackNoteIndex = [1,3,5,8,10], whiteNotesFirstGroup = [3,5,7];
  let blockContainer;
	
	let values = [50]

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

  onMount(async () => {
    loadPlugin();
  });

  function loadPlugin() {
    MIDI.loadPlugin({
      soundfontUrl: "./midi_player/examples/soundfont/",
      instrument: [0,0,0,0,0],
      onprogress: function(state, progress) {
        console.log("State",state, progress);
        console.log(MIDI);

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
      console.log(currentMidi)

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
    if (pressDown) {
      let testingId = guidGenerator();
      let startTime = new Date().getTime();

      const block = document.createElement('div');
      block.textContent = '.'

      // width
      block.setAttribute(
        'style',
        'width: ' + calculateBlockWidth(index) + 'vw; left: ' + calculateBlockPosition(index) + 'vw; opacity:' + velocity + ';'
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

      MIDI.noteOn(channel, index + 21, velocity, delay);  

    } else {
      let endTime = new Date().getTime();
      let block = blockMap.get(index);
      console.log(index)
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
    <div class="col">
      <RangeSlider bind:values pips all="label" />
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
</style>
