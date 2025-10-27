
export interface GeneratedImage {
  style: string;
  imageUrl: string;
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
