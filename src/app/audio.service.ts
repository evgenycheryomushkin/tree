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

  playAudio(): void {
    if (this.isPlaying) return;
    const audio = new Audio();
    audio.src = '../../assets/audio/393348__amoek__birds-forest-woodpecker.wav';
    audio.load();
    audio.play();
    this.isPlaying = true;
  }
}
