document.addEventListener('DOMContentLoaded', event => {

    const uploadProgress = document.getElementsByTagName('progress')[0]
    const uploadStatus = document.getElementsByClassName('upload-status')[0]
    const form = document.getElementsByTagName('form')[0]
    const videosSection = document.getElementById('videos')
    const uploadedVideoSection = document.getElementById('uploaded-video')

    form.onsubmit = function() {
        var formData = new FormData(form)

        var request = new XMLHttpRequest()

        request.upload.onprogress = event => {
            if(event.lengthComputable) {
                var percentComplete = (event.loaded / event.total) * 100
                percentComplete = Math.round(percentComplete)
                uploadProgress.value = percentComplete
                uploadStatus.innerHTML = percentComplete + '%'
            }
        }

        request.onreadystatechange = () => {
            if(request.status == 0) {
                uploadStatus.innerHTML = 'Host Unreachable'
            }
            if(request.readyState == XMLHttpRequest.DONE && request.status == 200) {
                uploadStatus.innerHTML = 'Done!'
                let uploadedVideo = JSON.parse(request.response)
                uploadedVideoSection.innerHTML = `
                    <a href="/watch${uploadedVideo.path}"><h1>${uploadedVideo.title}</h1></a>
                    <video class="card" src="/uploads${uploadedVideo.path}" controls></video>
                    <div class="share-box">
                        Share URL
                        <div class="share-bar">
                            <input id="share-input" value="${location.href}watch${uploadedVideo.path}">
                            <button id="share-button" data-clipboard-target="#share-input">Copy to Clipboard</button>
                        </div>
                    </div>
                `
                uploadedVideoSection.style.display = 'block'
                new Clipboard('#share-button')
                form.reset()
            }
        }

        request.open('POST', form.getAttribute('action'), true)
        request.send(formData)

        return false // To avoid actual submission of the form
    }

    function listVideos() {
         fetch('/videos').then(response => { 
            return response.json()
        }).then(videoDirs => {
            for(videoDir in videoDirs) {
                let video = videoDirs[videoDir][0]
                videosSection.innerHTML += `
                    <article>
                        <a href="/watch/${videoDir}/${video}"><h1>${video}</h1></a>
                        <video class="card" src="/uploads/${videoDir}/${video}" controls preload="none" poster="/uploads/${videoDir}/thumbnail.png">
                    </article>`
            }
        })
    }

    listVideos()

})