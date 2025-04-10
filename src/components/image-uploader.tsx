"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Upload, X, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";
// use this package to remove background from image
import { removeBackground } from "@imgly/background-removal";
// Define the allowed file types
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

// Create a Zod schema for file validation
const imageFileSchema = z.object({
	type: z.enum(ALLOWED_FILE_TYPES),
	size: z.number().max(5 * 1024 * 1024), // 5MB max size
});

type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

export function ImageUploader() {
	// In the useState declaration, add a comment about the image URL
	// This is where the image URL (base64 string) is stored after upload
	const [image, setImage] = useState<string | null>(null);
	const [processedImage, setProcessedImage] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [progress, setProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processImage = async (imageUrl: string) => {
		try {
			setIsProcessing(true);
			setProgress(0);
			const blob = await removeBackground(imageUrl, {
				progress: (key, current, total) => {
					const progress = (current / total) * 100;
					setProgress(progress);
					console.log(`${key}: ${current} of ${total}`);
				},
				output: {
					format: "image/png",
					quality: 0.8,
				},
				model: "isnet_fp16", // Use medium model for better quality
				debug: false, // Disable debug mode to reduce console noise
				
			});
			const processedUrl = URL.createObjectURL(blob);
			setProcessedImage(processedUrl);
		} catch (err) {
			console.error("Background removal error:", err);
			if (err instanceof Error) {
				setError(`Failed to remove background: ${err.message}`);
			} else {
				setError("Failed to remove background. Please try again.");
			}
		} finally {
			setIsProcessing(false);
			setProgress(0);
		}
	};

	const handleDownload = () => {
		if (processedImage) {
			const link = document.createElement('a');
			link.href = processedImage;
			link.download = 'background-removed.png';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const validateAndProcessFile = (file: File) => {
		try {
			// Validate the file against our schema
			imageFileSchema.parse({
				type: file.type as AllowedFileType,
				size: file.size,
			});

			const reader = new FileReader();
			reader.onload = () => {
				const imageUrl = reader.result as string;
				setImage(imageUrl);
				setError(null);
				processImage(imageUrl);
			};
			reader.readAsDataURL(file);
		} catch (err) {
			if (err instanceof z.ZodError) {
				setError("Please upload a valid PNG, JPG, or WEBP image (max 5MB)");
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			validateAndProcessFile(file);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file) {
			validateAndProcessFile(file);
		}
	};

	const clearImage = () => {
		setImage(null);
		setProcessedImage(null);
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="flex flex-col items-center space-y-8 w-full">
			<Card className="w-full max-w-4xl">
				<CardContent className="p-6">
					<div
						className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
							isDragging ? "border-purple-500 bg-zinc-800/50" : "border-zinc-700 hover:border-zinc-500"
						}`}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						onClick={() => fileInputRef.current?.click()}
					>
						<input
							aria-label="Upload an image"
							type="file"
							ref={fileInputRef}
							onChange={handleFileChange}
							accept=".png,.jpg,.jpeg,.webp"
							className="hidden"
						/>
						<Upload className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
						<h3 className="text-xl font-medium mb-2">Upload an image</h3>
						<p className="text-zinc-400 mb-4">Drag and drop or click to browse</p>
						<p className="text-sm text-zinc-500 mb-4">Supported formats: PNG, JPG, WEBP (max 5MB)</p>
						{error && (
							<p className="text-red-500 text-sm mb-4">{error}</p>
						)}
						<Button
							variant="outline"
							className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
						>
							Select Image
						</Button>
					</div>
				</CardContent>
			</Card>

			{(image || processedImage) && (
				<div className="w-full max-w-6xl">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Preview</h2>
						<div className="flex gap-2">
							{processedImage && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleDownload}
									className="flex items-center gap-2"
								>
									<Download className="h-4 w-4" />
									Download
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon"
								onClick={clearImage}
								className="text-zinc-400 hover:text-white hover:bg-zinc-800"
							>
								<X className="h-5 w-5" />
							</Button>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<Card className="overflow-hidden">
							<div className="relative aspect-video bg-zinc-800 flex items-center justify-center min-h-[500px]">
								{image && (
									<img
										src={image}
										alt="Original image"
										className="max-h-full max-w-full object-contain"
									/>
								)}
							</div>
							<div className="p-4 text-center">
								<p className="text-sm text-zinc-400">Original Image</p>
							</div>
						</Card>
						<Card className="overflow-hidden">
							<div className="relative aspect-video bg-zinc-800 flex items-center justify-center min-h-[500px]">
								{isProcessing ? (
									<div className="flex flex-col items-center justify-center w-full">
										<Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
										<div className="w-full max-w-xs">
											<div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
												<div
													className="h-full bg-purple-500 transition-all duration-300"
													style={{ width: `${progress}%` }}
												/>
											</div>
										</div>
										<p className="mt-2 text-sm text-zinc-400">
											Removing background... {Math.round(progress)}%
										</p>
									</div>
								) : processedImage ? (
									<img
										src={processedImage}
										alt="Processed image"
										className="max-h-full max-w-full object-contain"
									/>
								) : null}
							</div>
							<div className="p-4 text-center">
								<p className="text-sm text-zinc-400">Background Removed</p>
							</div>
						</Card>
					</div>
				</div>
			)}
		</div>
	);
}
