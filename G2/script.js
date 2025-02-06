if ("serial" in navigator) {
    class BrailleTeacher {
        constructor() {
            this.port = null;
            this.reader = null;
            this.mode = "learning";
            this.currentLetterIndex = 0;
            this.correctInputs = 0;
            this.totalInputs = 0;
            this.progressChart = null;
            this.recognition = null;
            this.isListening = false;
            this.speechQueue = [];
            this.isSpeaking = false;
            this.alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
            this.words = ["bat", "cat", "moon", "star", "tree", "bee", "sun", "ice"];
            this.currentWordIndex = 0;
            this.currentWordLetterIndex = 0;
            this.alphabetFolds = {
                "a": "1", "b": "1 and 2", "c": "1 and 4", "d": "1, 4, and 5",
                "e": "1 and 5", "f": "1, 2 and 4", "g": "1, 2, 4, and 5",
                "h": "1, 2, and 5", "i": "2 and 4", "j": "2, 4, and 5",
                "k": "1 and 3", "l": "1, 2, and 3", "m": "1, 3, and 4",
                "n": "1, 3, 4, and 5", "o": "1, 3, and 5", "p": "1, 2, 3, and 4",
                "q": "1, 2, 3, 4, and 5", "r": "1, 2, 3, and 5", "s": "2, 3, and 4",
                "t": "2, 3, 4, and 5", "u": "1, 3, and 6", "v": "1, 2, 3, and 6",
                "w": "2, 4, 5, and 6", "x": "1, 3, 4, and 6", 
                "y": "1, 3, 4, 5, and 6", "z": "1, 3, 5, and 6"
            };
            this.initializeEventListeners();
            this.initProgressChart();
            this.initializeSpeechRecognition();
        }

        initializeSpeechRecognition() {
            if ('webkitSpeechRecognition' in window) {
                this.recognition = new webkitSpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';
                this.recognition.onresult = (event) => {
                    const last = event.results.length - 1;
                    const command = event.results[last][0].transcript.trim().toLowerCase();
                    if (command.includes("learning mode") || command.includes("learning")) {
                        this.switchMode("learning");
                        this.speak("Switching to learning mode");
                    } else if (command.includes("practice mode") || command.includes("practice")) {
                        this.switchMode("practice");
                        this.speak("Switching to practice mode");
                    }
                };
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.showStatus(`Speech recognition error: ${event.error}`);
                };
                this.recognition.onend = () => {
                    if (this.isListening) this.recognition.start();
                };
            }
        }

        startListening() {
            if (this.recognition && !this.isListening) {
                this.isListening = true;
                this.recognition.start();
                this.showStatus("Voice commands activated");
                this.speak("Voice commands are now active.");
            }
        }

        stopListening() {
            if (this.recognition && this.isListening) {
                this.isListening = false;
                this.recognition.stop();
                this.showStatus("Voice commands deactivated");
            }
        }

        // switchMode(newMode) {
        //     this.mode = newMode;
        //     document.getElementById("modeSelect").value = newMode;
        //     this.resetState();
        //     if (this.mode === "learning") {
        //         this.speak(`Switching to learning mode. Start with letter ${this.alphabet[0].toUpperCase()}.`);
        //     } else if (this.mode === "practice") {
        //         this.speak("Switching to practice mode.");
        //         setTimeout(() => this.announceCurrentWord(), 1000);
        //     }
        // }

        switchMode(newMode) {
            this.mode = newMode;
            document.getElementById("modeSelect").value = newMode;
            this.resetState();
            if (this.mode === "learning") {
                // Modified speak message to include fold mapping
                this.speak(`Switching to learning mode. Let's start with letter ${this.alphabet[0].toUpperCase()}. Fold ${this.alphabetFolds[this.alphabet[0]]} for ${this.alphabet[0].toUpperCase()}.`);
            } else if (this.mode === "practice") {
                this.speak("Switching to practice mode.");
                setTimeout(() => this.announceCurrentWord(), 1000);
            }
        }

        async connectToSerial() {
            try {
                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: 9600 });
                const decoder = new TextDecoderStream();
                this.port.readable.pipeTo(decoder.writable);
                this.reader = decoder.readable.getReader();
                this.showStatus("Connected successfully!");
                this.speak("Connected successfully!");
                this.readSerialData();
                this.startListening();
            } catch (error) {
                this.showStatus(`Connection failed: ${error.message}`);
            }
        }

        async readSerialData() {
            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) break;
                    if (value) this.handleBrailleInput(value.trim());
                }
            } catch (error) {
                this.showStatus(`Error reading data: ${error.message}`);
            }
        }

        handleBrailleInput(data) {
            if (!data) return;
            let outputText = "";
            try {
                if (this.mode === "learning") {
                    outputText = this.handleLearningMode(data);
                } else {
                    outputText = this.handlePracticeMode(data);
                }
                this.updateDisplay(outputText);
            } catch (error) {
                this.showStatus(`Error processing input: ${error.message}`);
            }
        }

        // handleLearningMode(data) {
        //     const currentLetter = this.alphabet[this.currentLetterIndex];
        //     if (data.toLowerCase() === currentLetter) {
        //         this.speak(`Correct! Now try ${this.alphabet[this.currentLetterIndex + 1] || 'practice mode'}.`);
        //         this.correctInputs++;
        //         this.currentLetterIndex++;
        //         if (this.currentLetterIndex < this.alphabet.length) {
        //             const nextLetter = this.alphabet[this.currentLetterIndex];
        //             this.speak(`Fold ${this.alphabetFolds[nextLetter]} for ${nextLetter.toUpperCase()}.`);
        //         }
        //     } else {
        //         this.speak(`Incorrect. Fold ${this.alphabetFolds[currentLetter]} for ${currentLetter.toUpperCase()}.`);
        //     }
        //     this.totalInputs++;
        //     this.updateProgressChart();
        //     return currentLetter.toUpperCase();
        // }

        handleLearningMode(data) {
            const currentLetter = this.alphabet[this.currentLetterIndex];
            if (data.toLowerCase() === currentLetter) {
                this.speak(`It is Correct!`);
                this.correctInputs++;
                this.currentLetterIndex++;
                if (this.currentLetterIndex < this.alphabet.length) {
                    const nextLetter = this.alphabet[this.currentLetterIndex];
                    // Added clear instruction for next letter
                    this.speak(`Now try ${nextLetter.toUpperCase()}. Fold ${this.alphabetFolds[nextLetter]}.`);
                } else {
                    this.speak("Completed alphabet! Switching to practice mode.");
                    this.switchMode("practice");
                }
            } else {
                // Added clear correction instruction
                this.speak(`  It is Incorrect. Please fold ${this.alphabetFolds[currentLetter]} for ${currentLetter.toUpperCase()}.`);
            }
            this.totalInputs++;
            this.updateProgressChart();
            return currentLetter.toUpperCase();
        }

        handlePracticeMode(data) {
            const currentWord = this.words[this.currentWordIndex];
            const currentLetter = currentWord[this.currentWordLetterIndex];
            if (data.toLowerCase() === currentLetter) {
                this.speak(currentLetter.toUpperCase());
                this.currentWordLetterIndex++;
                this.correctInputs++;
                if (this.currentWordLetterIndex === currentWord.length) {
                    this.speak(`Excellent! Completed ${currentWord.toUpperCase()}`);
                    this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
                    this.currentWordLetterIndex = 0;
                    setTimeout(() => this.announceCurrentWord(), 2000);
                }
            } else {
                this.speak(`Incorrect, try again.`);
                this.currentWordLetterIndex = 0;
                setTimeout(() => this.announceCurrentWord(), 2000);
            }
            this.totalInputs++;
            this.updateProgressChart();
            return currentWord.substring(0, this.currentWordLetterIndex).toUpperCase();
        }

        announceCurrentWord() {
            const currentWord = this.words[this.currentWordIndex];
            const letters = currentWord.toUpperCase().split('');
            this.speak(`Practice word: ${currentWord.toUpperCase()}`);
            letters.forEach((letter, index) => {
                setTimeout(() => {
                    this.speak(letter);
                    if (index === letters.length - 1) {
                        setTimeout(() => {
                            this.speak(`Start with ${this.alphabetFolds[currentWord[0]]} for ${currentWord[0].toUpperCase()}`);
                        }, 1000);
                    }
                }, (index + 1) * 1000);
            });
        }

        speak(text) {
            if (!text) return;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }

        initProgressChart() {
            const ctx = document.getElementById('progressChart').getContext('2d');
            this.progressChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Accuracy (%)',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true, max: 100 },
                        x: { title: { display: true, text: 'Attempts' } }
                    }
                }
            });
        }

        updateProgressChart() {
            if (this.totalInputs > 0) {
                const accuracy = (this.correctInputs / this.totalInputs) * 100;
                if (this.progressChart.data.labels.length > 20) {
                    this.progressChart.data.labels.shift();
                    this.progressChart.data.datasets[0].data.shift();
                }
                this.progressChart.data.labels.push(this.totalInputs.toString());
                this.progressChart.data.datasets[0].data.push(accuracy.toFixed(2));
                this.progressChart.update();
            }
        }

        updateDisplay(text) {
            const display = document.getElementById("brailleOutput");
            if (display) display.textContent = text;
        }

        showStatus(message) {
            const status = document.getElementById("statusMessage");
            if (status) {
                status.textContent = message;
                setTimeout(() => status.textContent = "", 3000);
            }
        }

        resetState() {
            this.currentLetterIndex = 0;
            this.correctInputs = 0;
            this.totalInputs = 0;
            this.currentWordIndex = 0;
            this.currentWordLetterIndex = 0;
            this.progressChart.data.labels = [];
            this.progressChart.data.datasets[0].data = [];
            this.progressChart.update();
            this.updateDisplay("");
        }

        initializeEventListeners() {
            document.getElementById("connectBtn").addEventListener("click", () => this.connectToSerial());
            document.getElementById("modeSelect").addEventListener("change", (event) => {
                this.switchMode(event.target.value);
            });
        }
    }

    new BrailleTeacher();
} else {
    alert("Web Serial API not supported. Use Chrome or Edge.");
}
