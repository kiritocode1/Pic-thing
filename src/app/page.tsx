import { ImageUploader } from "@/components/image-uploader";
import { GradientText } from "@/components/ui/gradient-text";
import Link from "next/link";

const page = () => {
  return (
    <div className="w-full min-h-screen">
      <div className="w-full p-4 flex justify-between items-center">
        <Link 
          href="https://github.com/kiritocode1/Pic-thing" 
          target="_blank"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          GitHub Repository
        </Link>
        <Link 
          href="https://aryank.online" 
          target="_blank"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Created by Blank
        </Link>
      </div>
      <div className="grid place-content-center gap-20">
        <span className="text-5xl font-bold text-center w-full ">
          The Ultimate <GradientText>Background</GradientText> Remover.
        </span>
        <ImageUploader />
      </div>
    </div>
  );
}

export default page;