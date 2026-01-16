1\. \*\*Repo URL:\*\* https://github.com/bmaltais/kohya\_ss  

&nbsp;  \*\*Stars count:\*\* 11.9k  

&nbsp;  \*\*Last updated:\*\* Jun 23, 2025  

&nbsp;  \*\*Key features:\*\* Gradio-based GUI for Kohya's Stable Diffusion training scripts; supports LoRA training with parameter customization, Dreambooth, fine-tuning, and SDXL; enables sample image generation during training with configurable prompts, resolution, and steps; integrates with extensions for model usage in generation workflows.  

&nbsp;  \*\*Why it fits my use case:\*\* This is a strong all-in-one for local LoRA training on your ~40 reference images for a simple stick figure style using SDXL or 1.5 base models. The GUI makes it user-friendly without CLI hassle, and it supports batch sample generation. While no built-in sprite post-processing, trained LoRAs can be used in tools like A1111 for background removal and sizing—your 16GB VRAM setup should handle it fine, but test VRAM usage during training.



2\. \*\*Repo URL:\*\* https://github.com/Nerogar/OneTrainer  

&nbsp;  \*\*Stars count:\*\* 2.7k  

&nbsp;  \*\*Last updated:\*\* Jan 13, 2026  

&nbsp;  \*\*Key features:\*\* GUI and CLI for diffusion model training including LoRA, full fine-tuning, and embeddings; supports SD 1.5 and XL; includes a Sampling UI for direct image generation from models; dataset tools for captioning (BLIP, WD-1.4) and mask creation (Rembg for background removal).  

&nbsp;  \*\*Why it fits my use case:\*\* Ideal for an integrated local pipeline—train LoRA on your stick figure sketches with ~40 images, generate batches via the sampling UI with prompts like "character jumping," and use built-in mask tools for basic post-processing like background removal. Runs locally on your hardware; the GUI simplifies setup, but if masks aren't precise for sprites, combine with external tools like GIMP. Recent activity ensures compatibility with current SD versions.



3\. \*\*Repo URL:\*\* https://github.com/AUTOMATIC1111/stable-diffusion-webui  

&nbsp;  \*\*Stars count:\*\* 160k  

&nbsp;  \*\*Last updated:\*\* Jul 27, 2024  

&nbsp;  \*\*Key features:\*\* Web UI for Stable Diffusion with txt2img/img2img modes; supports LoRA loading/preview in prompts; extensions for training (via integrations); post-processing via Extras tab with upscalers (ESRGAN, SwinIR), face restoration, and tiling for textures; batch processing and highres fix.  

&nbsp;  \*\*Why it fits my use case:\*\* Excellent for generation and post-processing after training LoRA elsewhere—load your trained stick figure LoRA, batch-generate sprites with consistent sizing via highres fix, and remove backgrounds/use upscalers for game-ready assets. Local setup with UI; your RTX-class GPU handles it well. Training isn't core (use extensions), but it's the most mature for the full pipeline. Documentation is solid, though activity is slightly older—verify compatibility with latest SDXL.



4\. \*\*Repo URL:\*\* https://github.com/derrian-distro/LoRA\_Easy\_Training\_Scripts  

&nbsp;  \*\*Stars count:\*\* 1.3k  

&nbsp;  \*\*Last updated:\*\* Apr 22, 2025  

&nbsp;  \*\*Key features:\*\* Pyside6 UI for simplifying LoRA/LoCon training with Kohya's sd-scripts; supports block weights, custom schedulers, TOML config saving, and queueing multiple jobs; integrates sampling args for image generation during training.  

&nbsp;  \*\*Why it fits my use case:\*\* Streamlines local LoRA training for your simple blue ink style with a beginner-friendly UI—no deep CLI needed for ~40 images on SD 1.5/XL. Batch generation via sampling; no direct sprite tools, but outputs integrate with post-processing in A1111 or ComfyUI for background removal and sizing. Your hardware is overkill here, ensuring smooth runs. Good docs and recent updates make it reliable.



5\. \*\*Repo URL:\*\* https://github.com/invoke-ai/invoke-training  

&nbsp;  \*\*Stars count:\*\* 190  

&nbsp;  \*\*Last updated:\*\* Oct 14, 2025  

&nbsp;  \*\*Key features:\*\* Library with CLI/GUI for training LoRA, DreamBooth LoRA, and Textual Inversion on Stable Diffusion/SDXL; pipelines configurable for custom models; compatible with InvokeAI for image generation post-training.  

&nbsp;  \*\*Why it fits my use case:\*\* Solid for local LoRA training on your notebook doodle style with small datasets like ~40 images; GUI eases use, and it supports SDXL. Generate images in InvokeAI afterward for batch prompts. No built-in post-processing, but trained models work in tools with background removal (e.g., via masks). Recent activity and good docs; challenge: test if it handles your VRAM efficiently for larger batches.



6\. \*\*Repo URL:\*\* https://github.com/AHEKOT/ComfyUI\_VNCCS  

&nbsp;  \*\*Stars count:\*\* 565  

&nbsp;  \*\*Last updated:\*\* Jan 10, 2026  

&nbsp;  \*\*Key features:\*\* ComfyUI custom nodes for character sprite creation; workflows for base character generation, clothing/emotion sets, finished sprites; dataset creator for LoRA training; integrates SDXL generation with ControlNet, upscaling (e.g., 4x\_APISR), face detailing, and seam fixing.  

&nbsp;  \*\*Why it fits my use case:\*\* Closest to an all-in-one for game sprites—prep datasets for LoRA training on your stick figures, generate consistent images with prompts, and post-process with built-in upscaling/background handling for sprite sheets. Local ComfyUI setup with node-based UI; supports batch via workflows. Your hardware fits perfectly. Bonus: Automates much of sprite creation. Very recent activity and tailored for assets like yours.



7\. \*\*Repo URL:\*\* https://github.com/Akegarasu/lora-scripts  

&nbsp;  \*\*Stars count:\*\* 5.9k  

&nbsp;  \*\*Last updated:\*\* Sep 8, 2025  

&nbsp;  \*\*Key features:\*\* GUI/CLI for LoRA and Dreambooth training using kohya-ss; WebUI for centralized training; integrates tag editor and WD 1.4 Tagger for dataset prep; supports Stable Diffusion workflows.  

&nbsp;  \*\*Why it fits my use case:\*\* User-friendly GUI for local LoRA training on SD 1.5/XL with your ~40 images; tagging helps for style consistency in stick figures. Generate samples during training. No sprite-specific post-processing, but integrates with editors for metadata—use outputs in A1111 for sizing/background removal. Strong community docs; your setup should run it efficiently, but monitor for any China-specific optimizations if irrelevant.

