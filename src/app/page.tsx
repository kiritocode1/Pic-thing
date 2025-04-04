import { ImageUploader } from "@/components/image-uploader";
import { GradientText } from "@/components/ui/gradient-text";





const page = () => {
  return (
		<div className="w-full min-h-screen grid place-content-center gap-20">
			<span className="text-5xl font-bold text-center w-full ">
				The Ultimate <GradientText>Background</GradientText> Remover.
			</span>
			<ImageUploader />
		</div>
  );
}

export default page;