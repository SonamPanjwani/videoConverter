const express = require("express");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const expressFileUpload = require("express-fileupload");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

ffmpeg.setFfmpegPath("C:\\Path_ffmpeg\\ffmpeg.exe");
ffmpeg.setFfprobePath("C:\\Path_ffmpeg\\ffprobe.exe");
ffmpeg.setFlvtoolPath("C:\\Path_ffmpeg\\ffplay.exe");

console.log(ffmpeg);

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(
  expressFileUpload({
    useTempFiles: false,
    tempFileDir: "/temp/",
  })
);

app.get("/", (req, resp) => {
  //resp.send("Hello world ");
  resp.sendFile(path.join(__dirname, "index.html"));
});

app.post("/convert", (req, res) => {
  console.log("m in app.post");

  let to = req.body.to;
  let file = req.files.file;

  console.log("format ", to);

  console.log("file details", file);

  // checkinng agar dono i/p /p format same hoga to error aana chahiye
  const inputExt = path.extname(file.name).slice(1);
  const outputExt = to.replace(".", "");
  if (inputExt === outputExt) {
    console.log("Input and output formats are the same.");
    return res
      .status(400)
      .send(
        "Input and output formats are the same. Please choose a different output format."
      );
  }
  const inputPath = path.join(__dirname, "temp", file.name);
  const outputFileName = path.basename(file.name, path.extname(file.name)) + to;
  const outputPath = path.join(__dirname, "temp", outputFileName);
  const filePath = path.join(__dirname, "temp", file.name);
  console.log("Moving file to:", filePath);

  file.mv(path.join(__dirname, "temp", file.name), function (err) {
    if (err) {
      console.error("file upload failed", err);
      return res.sendStatus(500).send(err);
    }
    console.log("file upload successfully");
    ffmpeg(inputPath)
      .toFormat(to.replace(".", "")) // Removing the dot from format
      .on("start", () => {
        console.log("conversion started");
      })
      .on("progress", (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on("end", () => {
        console.log("Conversion finished successfully");
        res.download(outputPath, (err) => {
          if (err) {
            console.error("Download failed:", err);
            return res.status(500).send(err);
          }

          //deleting the file after the conversion to free up space
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          console.log("Files clean");
        });
      })
      .on("error", (err) => {
        console.error("ErrorinConversion ", err);
        return res.status(500).send("Conversion failed: " + err.message);
      })
      .save(outputPath);
  });
});

app.listen(4000, () => {
  console.log("App is active on port 4000");
});
