// if ("serial" in navigator) {
//     class BrailleTeacher {
//         constructor() {
//             this.port = null;
//             this.reader = null;
//             this.mode = "learning";
//             this.currentLetterIndex = 0;
//             this.correctInputs = 0;
//             this.totalInputs = 0;
//             this.progressChart = null;
//             this.recognition = null;
//             this.isListening = false;
//             this.speechQueue = [];
//             this.isSpeaking = false;

//             // Constants
//             this.alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
//             this.words = ["bat", "cat", "moon", "star", "tree", "bee", "sun", "ice"];
//             this.currentWordIndex = 0;
//             this.currentWordLetterIndex = 0;

//             // Braille patterns mapping
//             this.alphabetFolds = {
//                 "a": "1",
//                 "b": "1 and 2",
//                 "c": "1 and 4",
//                 "d": "1, 4, and 5",
//                 "e": "1 and 5",
//                 "f": "1, 2 and 4",
//                 "g": "1, 2, 4, and 5",
//                 "h": "1, 2, and 5",
//                 "i": "2 and 4",
//                 "j": "2, 4, and 5",
//                 "k": "1 and 3",
//                 "l": "1, 2, and 3",
//                 "m": "1, 3, and 4",
//                 "n": "1, 3, 4, and 5",
//                 "o": "1, 3, and 5",
//                 "p": "1, 2, 3, and 4",
//                 "q": "1, 2, 3, 4, and 5",
//                 "r": "1, 2, 3, and 5",
//                 "s": "2, 3, and 4",
//                 "t": "2, 3, 4, and 5",
//                 "u": "1, 3, and 6",
//                 "v": "1, 2, 3, and 6",
//                 "w": "2, 4, 5, and 6",
//                 "x": "1, 3, 4, and 6",
//                 "y": "1, 3, 4, 5, and 6",
//                 "z": "1, 3, 5, and 6"
//             };

//             this.initializeEventListeners();
//             this.initProgressChart();
//             this.initializeSpeechRecognition();
//         }

//         initializeSpeechRecognition() {
//             if ('webkitSpeechRecognition' in window) {
//                 this.recognition = new webkitSpeechRecognition();
//                 this.recognition.continuous = true;
//                 this.recognition.interimResults = false;
//                 this.recognition.lang = 'en-US';

//                 this.recognition.onresult = (event) => {
//                     const last = event.results.length - 1;
//                     const command = event.results[last][0].transcript.trim().toLowerCase();
                    
//                     if (command.includes("learning mode") || command.includes("learning")) {
//                         this.switchMode("learning");
//                         this.speak("Switching to learning mode");
//                     } else if (command.includes("practice mode") || command.includes("practice")) {
//                         this.switchMode("practice");
//                         this.speak("Switching to practice mode");
//                     }
//                 };

//                 this.recognition.onerror = (event) => {
//                     console.error('Speech recognition error:', event.error);
//                     this.showStatus(`Speech recognition error: ${event.error}`);
//                 };

//                 this.recognition.onend = () => {
//                     if (this.isListening) {
//                         this.recognition.start();
//                     }
//                 };
//             } else {
//                 console.error('Speech Recognition is not supported');
//                 this.showStatus('Speech Recognition is not supported in this browser');
//             }
//         }

//         startListening() {
//             if (this.recognition && !this.isListening) {
//                 this.isListening = true;
//                 this.recognition.start();
//                 this.showStatus("Voice commands activated");
//                 this.speak("Voice commands are now active. You can say 'learning mode' or 'practice mode' to switch modes.");
//             }
//         }

//         stopListening() {
//             if (this.recognition && this.isListening) {
//                 this.isListening = false;
//                 this.recognition.stop();
//                 this.showStatus("Voice commands deactivated");
//             }
//         }

//         switchMode(newMode) {
//             this.mode = newMode;
//             document.getElementById("modeSelect").value = newMode;
//             this.resetState();
            
//             if (this.mode === "learning") {
//                 this.speak(`Switching to learning mode. Let's start with the letter ${this.alphabet[0].toUpperCase()}. Fold ${this.alphabetFolds[this.alphabet[0]]}.`);
//             } else if (this.mode === "practice") {
//                 this.speak("Switching to practice mode.");
//                 setTimeout(() => this.announceCurrentWord(), 1000);
//             }
//         }

//         async connectToSerial() {
//             try {
//                 this.port = await navigator.serial.requestPort();
//                 await this.port.open({ baudRate: 9600 });

//                 const decoder = new TextDecoderStream();
//                 const inputDone = this.port.readable.pipeTo(decoder.writable);
//                 this.reader = decoder.readable.getReader();

//                 this.showStatus("Connected successfully!");
//                 this.speak("Connected successfully! Starting voice commands.");
//                 this.readSerialData();
//                 this.startListening(); // Start listening for voice commands after serial connection
//             } catch (error) {
//                 this.showStatus(`Connection failed: ${error.message}`);
//                 console.error("Failed to connect to serial port:", error);
//             }
//         }

//         async readSerialData() {
//             try {
//                 while (true) {
//                     const { value, done } = await this.reader.read();
//                     if (done) {
//                         this.showStatus("Connection closed");
//                         this.reader.releaseLock();
//                         break;
//                     }
//                     if (value) {
//                         this.handleBrailleInput(value.trim());
//                     }
//                 }
//             } catch (error) {
//                 this.showStatus(`Error reading data: ${error.message}`);
//                 console.error("Error reading serial data:", error);
//             }
//         }

//         handleBrailleInput(data) {
//             if (!data) return;

//             let outputText = "";
            
//             try {
//                 if (this.mode === "learning") {
//                     outputText = this.handleLearningMode(data);
//                 } else if (this.mode === "practice") {
//                     outputText = this.handlePracticeMode(data);
//                 }

//                 this.updateDisplay(outputText);
//             } catch (error) {
//                 this.showStatus(`Error processing input: ${error.message}`);
//                 console.error("Error handling input:", error);
//             }
//         }

//         handleLearningMode(data) {
//             const currentLetter = this.alphabet[this.currentLetterIndex];
            
//             if (data.toLowerCase() === currentLetter) {
//                 this.speak(`Great! You folded ${currentLetter.toUpperCase()} correctly.`);
//                 this.correctInputs++;
//                 this.currentLetterIndex++;

//                 if (this.currentLetterIndex < this.alphabet.length) {
//                     const nextLetter = this.alphabet[this.currentLetterIndex];
//                     this.speak(`Now fold ${nextLetter.toUpperCase()}. Fold ${this.alphabetFolds[nextLetter]}.`);
//                 } else {
//                     this.speak("Congratulations! You have completed learning the alphabet. Let's try forming words in practice mode.");
//                     this.mode = "practice";
//                     document.getElementById("modeSelect").value = "practice";
//                     this.announceCurrentWord();
//                 }
//             } else {
//                 this.speak(`Incorrect! Fold ${this.alphabetFolds[currentLetter]} for ${currentLetter.toUpperCase()}.`);
//             }

//             this.totalInputs++;
//             this.updateProgressChart();
//             return currentLetter.toUpperCase();
//         }

//         handlePracticeMode(data) {
//             const currentWord = this.words[this.currentWordIndex];
//             const currentLetter = currentWord[this.currentWordLetterIndex];

//             if (data.toLowerCase() === currentLetter) {
//                 this.speak(currentLetter.toUpperCase());
//                 this.currentWordLetterIndex++;
//                 this.correctInputs++;

//                 if (this.currentWordLetterIndex === currentWord.length) {
//                     this.speak(`Excellent! You completed the word ${currentWord.toUpperCase()}`);
//                     this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
//                     this.currentWordLetterIndex = 0;
//                     setTimeout(() => this.announceCurrentWord(), 2000);
//                 }
//             } else {
//                 this.speak(`${data.toUpperCase()}, Incorrect, let's try again.`);
//                 this.currentWordLetterIndex = 0;
//                 setTimeout(() => this.announceCurrentWord(), 2000);
//             }

//             this.totalInputs++;
//             this.updateProgressChart();
//             return currentWord.substring(0, this.currentWordLetterIndex).toUpperCase();
//         }


//         async announceCurrentWord() {
//             const currentWord = this.words[this.currentWordIndex];
//             const letters = currentWord.toUpperCase().split('');
//             // Clear any existing queue
//             this.speechQueue = [];            
//             // Add full sequence to queue
//             this.queueSpeech(`Let's practice the word ${currentWord.toUpperCase()}.`);
//             this.queueSpeech("The letters are:"); 
                    
//             // Create a promise to handle the word pronunciation
//             const speakWord = () => {
//                 return new Promise((resolve) => {
//                     const utterance = new SpeechSynthesisUtterance(`The word is ${currentWord.toUpperCase()}`);
//                     utterance.rate = 1.5;
//                     utterance.onend = resolve;
//                     window.speechSynthesis.speak(utterance);
//                 });
//             };

//             // Create a promise to handle individual letter pronunciation
//             const speakLetter = (letter) => {
//                 return new Promise((resolve) => {
//                     const utterance = new SpeechSynthesisUtterance(letter);
//                     utterance.rate = 0.9;
//                     utterance.onend = resolve;
//                     window.speechSynthesis.speak(utterance);
//                 });
//             };

//             // Sequence the speech
//             try {
//                 // First speak the word
//                 await speakWord();
                
//                 // Wait a bit before starting to spell
//                 await new Promise(resolve => setTimeout(resolve, 1000));
                
//                 // Speak each letter
//                 for (const letter of letters) {
//                     await speakLetter(letter);
//                     await new Promise(resolve => setTimeout(resolve, 500)); // Small pause between letters
//                 }
                
//                 // Wait before speaking the folding instructions
//                 await new Promise(resolve => setTimeout(resolve, 1000));
                
//                 // Speak the folding instructions for the first letter
//                 const firstLetter = currentWord[0].toUpperCase();
//                 this.speak(`Fold ${this.alphabetFolds[currentWord[0]]} for ${firstLetter}`);
                
//             } catch (error) {
//                 console.error("Error in speech sequence:", error);
//             }
//         }

//         speak(text) {
//             if (!text) return;
            
//             // Cancel any ongoing speech
//             // window.speechSynthesis.cancel();

//             const utterance = new SpeechSynthesisUtterance(text);
//             utterance.rate = 0.9;
//             utterance.pitch = 1.0;
//             window.speechSynthesis.speak(utterance);
//         }

//         handlePracticeMode(data) {
//             const currentWord = this.words[this.currentWordIndex];
//             const currentLetter = currentWord[this.currentWordLetterIndex];

//             if (data.toLowerCase() === currentLetter) {
//                 this.speak(currentLetter.toUpperCase());
//                 this.currentWordLetterIndex++;
//                 this.correctInputs++;

//                 if (this.currentWordLetterIndex === currentWord.length) {
//                     this.speak(`Excellent! You completed the word ${currentWord.toUpperCase()}`);
//                     this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
//                     this.currentWordLetterIndex = 0;
//                     setTimeout(() => this.announceCurrentWord(), 2000);
//                 }
//             } else {
//                 this.speak(`${data.toUpperCase()}, Incorrect, let's try again.`);
//                 this.currentWordLetterIndex = 0;
//                 setTimeout(() => this.announceCurrentWord(), 2000);
//             }

//             this.totalInputs++;
//             this.updateProgressChart();
//             return currentWord.substring(0, this.currentWordLetterIndex).toUpperCase();
//         }

//         announceCurrentWord() {
//             const currentWord = this.words[this.currentWordIndex];
//             const letters = currentWord.toUpperCase().split('');
            
//             // First announce the full word/////////////////////////////////////////////////////////////////////////////////////////
//             this.speak(`Let's practice the word. ${currentWord.toLowerCase()}`);
//             // this.speak(`Let's practice the word. ${this.currentWordIndex}`);
            
//             // Then announce each letter with a delay
//             letters.forEach((letter, index) => {
//                 setTimeout(() => {
//                     this.speak(letter);
                    
//                     // If it's the last letter, announce the folding instructions
//                     if (index === letters.length - 1) {
//                         setTimeout(() => {
//                             this.speak(`Fold ${this.alphabetFolds[currentWord[0]]} for ${currentWord[0].toUpperCase()}`);
//                         }, 1000);
//                     }
//                 }, (index + 1) * 1000);
//             });
//         }

//         speak(text) {
//             if (!text) return;
            
//             // Cancel any ongoing speech
//             // window.speechSynthesis.cancel();

//             const utterance = new SpeechSynthesisUtterance(text);
//             utterance.rate = 0.9; // Slightly slower rate for better clarity
//             utterance.pitch = 1.0;
//             window.speechSynthesis.speak(utterance);
//         }

//         initProgressChart() {
//             const ctx = document.getElementById('progressChart').getContext('2d');
//             this.progressChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: [],
//                     datasets: [{
//                         label: 'Accuracy (%)',
//                         data: [],
//                         backgroundColor: 'rgba(75, 192, 192, 0.2)',
//                         borderColor: 'rgba(75, 192, 192, 1)',
//                         borderWidth: 1,
//                         tension: 0.4
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             max: 100,
//                             title: {
//                                 display: true,
//                                 text: 'Accuracy (%)'
//                             }
//                         },
//                         x: {
//                             title: {
//                                 display: true,
//                                 text: 'Attempts'
//                             }
//                         }
//                     }
//                 }
//             });
//         }

//         updateProgressChart() {
//             if (this.totalInputs > 0) {
//                 const accuracy = (this.correctInputs / this.totalInputs) * 100;
                
//                 if (this.progressChart.data.labels.length > 20) {
//                     this.progressChart.data.labels.shift();
//                     this.progressChart.data.datasets[0].data.shift();
//                 }
                
//                 this.progressChart.data.labels.push(this.totalInputs.toString());
//                 this.progressChart.data.datasets[0].data.push(accuracy.toFixed(2));
//                 this.progressChart.update();
//             }
//         }

//         updateDisplay(text) {
//             const display = document.getElementById("brailleOutput");
//             if (display) {
//                 display.textContent = text;
//             }
//         }

//         showStatus(message) {
//             const status = document.getElementById("statusMessage");
//             if (status) {
//                 status.textContent = message;
//                 setTimeout(() => {
//                     status.textContent = "";
//                 }, 3000);
//             }
//         }

//         resetState() {
//             this.currentLetterIndex = 0;
//             this.correctInputs = 0;
//             this.totalInputs = 0;
//             this.currentWordIndex = 0;
//             this.currentWordLetterIndex = 0;
            
//             this.progressChart.data.labels = [];
//             this.progressChart.data.datasets[0].data = [];
//             this.progressChart.update();
            
//             this.updateDisplay("");

//             if (this.mode === "practice") {
//                 setTimeout(() => this.announceCurrentWord(), 500);
//             }
//         }

//         initializeEventListeners() {
//             document.getElementById("connectBtn").addEventListener("click", () => this.connectToSerial());
            
//             document.getElementById("modeSelect").addEventListener("change", (event) => {
//                 this.switchMode(event.target.value);
//             });
//         }
//     }

//     // Initialize the application
//     const brailleTeacher = new BrailleTeacher();
// } else {
//     alert("Web Serial API is not supported in this browser. Please use Chrome or Edge.");
// }
