"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { z } from "zod";

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
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateAndProcessFile = (file: File) => {
		try {
			// Validate the file against our schema
			imageFileSchema.parse({
				type: file.type as AllowedFileType,
				size: file.size,
			});

			const reader = new FileReader();
			reader.onload = () => {
				// The image URL is set here as a base64 string
				setImage(reader.result as string);
				setError(null);
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
		setError(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div className="flex flex-col items-center space-y-8">
			<Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
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

			{image && (
				<div className="w-full max-w-2xl">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Preview</h2>
						<Button
							variant="ghost"
							size="icon"
							onClick={clearImage}
							className="text-zinc-400 hover:text-white hover:bg-zinc-800"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<Card className="overflow-hidden bg-zinc-900 border-zinc-800">
						<div className="relative aspect-video bg-zinc-800 flex items-center justify-center">
							<img
								// This is where the image URL is used for display
								// The image state variable contains the base64 data URL of the uploaded image
								src={image || "/placeholder.svg"}
								alt="Uploaded preview"
								className="max-h-full max-w-full object-contain"
							/>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}
