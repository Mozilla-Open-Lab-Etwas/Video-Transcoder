import { createFFmpeg } from '@ffmpeg/ffmpeg';
import ComponentStore from '../store/componentStore';

const { ProgressStore, updateLoaded } = ComponentStore;
const { updateProgress } = ProgressStore;

export type FFmpegDataType = {
  outputFileName: string;
  threads: number;
  ffmpegCommands: string;
};
// @ts-ignore Defined later
const exportedElements: {
  ffmpegWriter: (file: File) => Promise<string>;
  ffmpegReader: (fileName: string) => Promise<Uint8Array>;
  ffmpegRunner: (fileName: string, ffmpegData: FFmpegDataType) => Promise<string>;
} = {};

/** *
 * Mocking Behavior for JS DOM for Testing Purposes
 */

// if (window.navigator.userAgent.includes('jsdom')) {
//   // This is a testing environment and not a production environment.

//   // Mock Functions

//   const mockWriter = async (file: File) => 'mock-name';
//   const mockReader = async (filename: string) => {
//     const newMockArray = new Uint8Array();
//     return newMockArray;
//   };
//   const mockRunner = async (fileName: string, ffmpegData: FFmpegDataType) =>
// 'processed-mock-name';
//   exportedElements.ffmpegRunner = mockRunner;
//   exportedElements.ffmpegReader = mockReader;
//   exportedElements.ffmpegWriter = mockWriter;
// } else {
/**
 * Creates an FFmpeg Instance and Updates the progress bar with progress value
 */
const ffmpeg = createFFmpeg({
  log: true,
  progress: (input: any) => {
    const value: number = input.ratio * 100.0;
    if (value > 0) {
      console.info(`Completed ${value.toFixed(2)}%`);
      updateProgress(value);
    }
  },
});

/** Checks if FFmpeg is supported on that browser */
const loadFFmpeg = async () => {
  try {
    await ffmpeg.load();
  } catch (err) {
    console.error(window.navigator.userAgent, err.message);
    // eslint-disable-next-line no-alert
    alert(`Your Browser is not supported ${err.message}`);
  }
  updateLoaded(true);
};

/** *
 * FFmpeg Writer Loads a Video in WASM Memory for FFmpeg to use later
 * @param file is the actual inputted file from the user
 * @retuns The name of the file the user added
 */

const ffmpegWriter = async (file: File) => {
  const { name } = file;
  await ffmpeg.write(name, file);
  return name;
};

/** *
 * FFmpeg Reader Reads a Video from WASM Memory into JavaScript
 * @param fileName is the file name of the video which would like to be read
 * @return Uint8Array of data containing the file
 */

const ffmpegReader = async (fileName: string) => {
  const processedFile: Uint8Array = ffmpeg.read(`${fileName}`);
  return processedFile;
};

/** *
 * FFmpeg Runner Executes an FFmpeg Command in WASM
 * @param fileName is the name of the file on which the command is executed.
 * @param ffmpegData is the parameters of the executed and are of type {@link FFmpegDataType}
 * @return a file name as string of the processed file.
 */

const ffmpegRunner = async (fileName: string, ffmpegData: FFmpegDataType) => {
  const { outputFileName, threads, ffmpegCommands } = ffmpegData;
  const commandString = `-i '${fileName}' -threads ${threads} ${ffmpegCommands} -strict -2 ${outputFileName}`;
  console.log('Running FFmpeg', commandString);
  try {
    const promise = await ffmpeg.run(commandString);
    console.log('Returning output', promise);
    return outputFileName;
  } catch (err) {
    console.trace();
    console.info(err.message);
  }
};

// Exporting the Above Functions
// exportedElements.ffmpegRunner = ffmpegRunner;
// exportedElements.ffmpegReader = ffmpegReader;
// exportedElements.ffmpegWriter = ffmpegWriter;
// }

// const { ffmpegRunner, ffmpegReader, ffmpegWriter } = exportedElements;

export { loadFFmpeg, ffmpegRunner, ffmpegReader, ffmpegWriter };