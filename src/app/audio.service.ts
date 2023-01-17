import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  constructor() { }

  init() {
    console.log("Card Service initialized")
  }

  isPlaying: boolean = false;

  audio = new Audio();

  playAudio(): void {
    if (this.isPlaying) return;
    this.audio.src = '../../assets/audio/393348__amoek__birds-forest-woodpecker.wav';
    this.audio.load();
    this.audio.play();
    this.isPlaying = true;
  }
  
  stopAudio() {
    this.audio.pause();
    this.isPlaying = false;
  }
}
