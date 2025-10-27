
export interface GeneratedImage {
  style: string;
  imageUrl: string;
  originalFileName?: string;
}

export interface GeneratedVideo {
  prompt: string;
  videoUrl: string;
  aspectRatio: '16:9' | '9:16';
  originalFileName?: string; // To name the downloaded file
}

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface TextPart {
  text: string;
}
