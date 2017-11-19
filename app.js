const path = require('path')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')

const express = require('express')
const app = express()

const uploadsDir = path.join(__dirname, 'public/uploads')

const multer  = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let savePath = path.join(uploadsDir, Date.now().toString())
        fs.mkdirSync(savePath)
        cb(null, savePath)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'pug')

app.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file.destination)
    ffmpeg(req.file.path).thumbnail({
        timestamps: ['15%'],
        folder: req.file.destination,
        filename: 'thumbnail.png'
    })
    res.json({
        title: req.file.originalname,
        path: req.file.path.replace(uploadsDir, '').replace('\\', '/').replace('\\', '/')
    })
})

const isDirectory = filePath => fs.statSync(filePath).isDirectory()

const readdirSync = filePath => fs.readdirSync(filePath).filter(file => file != '.gitignore').filter(file => file != 'thumbnail.png')

// From https://gist.github.com/kethinov/6658166#gistcomment-1976458
const lsDir = (dir, fileList = []) => {
    readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        fileList.push(isDirectory(filePath) ? {[file]: lsDir(filePath)} : file)
    })
    return fileList
}

const getDirectories = filePath => readdirSync(filePath).map(name => path.join(filePath, name)).filter(isDirectory)

app.get('/videos', (req, res) => {
    let videos = lsDir(uploadsDir)
    videos = videos.reverse() // reverse the array so that it's ordered newest first, oldest last
    videos = Object.assign({}, ...videos)
    res.json(videos)
})

// both /watch/folder & /watch/folder/filename will be valid routes - granted filename exists as url decoration & for readability purposes only
app.get('/watch/:folder/:filename?', (req, res) => {
    let foundDir = getDirectories(uploadsDir).filter(videoDir => videoDir.match(req.params.folder))
    if(foundDir.length == 1) {
        let videoFileName = readdirSync(foundDir[0])[0]
        if(videoFileName) {
            res.render('video', {
                title: videoFileName,
                videoPath: `/uploads/${req.params.folder}/${videoFileName}`,
                rootUrl: req.protocol + '://' + req.get('host')
            })
        } else {
            res.send("No video found")
        }
    } else {
        res.send("No video found")
    }
})

app.listen(9885)