import { Players } from "./Data"

export interface UserImageProps {
	userImages: Players[]
	isMultiplayer: boolean
	currentStep: string
	rotation: string
}