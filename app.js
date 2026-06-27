// 1. Déclaration des variables globales
let mediaRecorder; // Le moteur d'enregistrement
let audioChunks = []; // Le tableau qui va stocker les morceaux de voix

// Récupération des éléments HTML
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const statusText = document.getElementById('status');

// 2. Fonction pour démarrer l'enregistrement
btnStart.addEventListener('click', async () => {
    try {
        // Demander l'accès au microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialiser l'enregistreur
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // Vider les anciens enregistrements

        // À chaque fois que de la donnée audio est disponible, on la stocke
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // Que faire quand l'enregistrement s'arrête ?
        mediaRecorder.onstop = () => {
            // Créer un fichier audio (Blob) à partir des morceaux
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Envoyer le fichier au serveur n8n
            envoyerAudioVersN8N(audioBlob);
            
            // Couper le micro
            stream.getTracks().forEach(track => track.stop());
        };

        // Démarrer l'enregistrement
        mediaRecorder.start();
        
        // Mettre à jour l'interface
        statusText.textContent = "🔴 Écoute en cours...";
        statusText.classList.add('recording');
        btnStart.disabled = true;
        btnStop.disabled = false;

    } catch (erreur) {
        console.error("Erreur d'accès au micro :", erreur);
        statusText.textContent = "Erreur : Accès au microphone refusé.";
    }
});

// 3. Fonction pour arrêter l'enregistrement
btnStop.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop(); // Cela déclenche automatiquement l'événement 'onstop' plus haut
        
        // Mettre à jour l'interface
        statusText.textContent = "Traitement et envoi en cours...";
        statusText.classList.remove('recording');
        btnStart.disabled = false;
        btnStop.disabled = true;
    }
});

// 4. Fonction pour expédier le fichier audio
async function envoyerAudioVersN8N(blob) {
    // Le robot GitHub Actions va toujours remplacer cette ligne lors du déploiement !
    const webhookUrl = "https://zdkzi-41-214-24-65.free.pinggy.net/webhook/capture-vocale"; 

    // Préparer les données comme si c'était un formulaire d'upload de fichier
    const formData = new FormData();
    formData.append('audio', blob, 'voix_utilisateur.webm');

    try {
        // Effectuer la requête HTTP POST
        const reponse = await fetch(webhookUrl, {
            method: 'POST',
            body: formData
        });

        if (reponse.ok) {
            statusText.textContent = "✅ Audio transmis à l'orchestrateur avec succès !";
            console.log("Transmission réussie !");
        } else {
            statusText.textContent = "❌ Échec de la transmission.";
            console.error("Erreur serveur :", reponse.status);
        }
    } catch (erreur) {
        statusText.textContent = "❌ Impossible de joindre l'orchestrateur.";
        console.error("Erreur réseau :", erreur);
    }
}
