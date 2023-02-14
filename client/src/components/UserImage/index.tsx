import { Avatar, ImageList, ImageListItem } from "@mui/material"
import { getAnimalBlackImageByLetter } from "../../helpers/animalHelpBlack"
import { getAnimalColorImageByLetter } from "../../helpers/animalHelpColor";
import { getAnimalByLetter } from "../../helpers/animalHelpIcons";
import { UserImageProps } from "../../models/UserImage";
import style from './style.module.css';


export const UserImage = ({ userImages, isMultiplayer, currentStep, rotation }: UserImageProps) => {

	const getClassName = (letter: string) => {
		if (isMultiplayer || letter === currentStep)
			return [style.custom_image, style.current].join(' ');
		else return style.custom_image;
	}

	const getCurrentUser = (letter: string) => {
		if (isMultiplayer || letter === currentStep)
			return getAnimalColorImageByLetter(letter)
		else return getAnimalBlackImageByLetter(letter)
	}


	return (
		<>
			<ImageList className={style.custom_image_list} sx={{ overflowY: 'visible' }} cols={1} >
				{userImages.map((p, id) => (
					<ImageListItem key={id}>
						<img
							src={getCurrentUser(p.letter)}
							alt={'animal' + p.letter}
							className={getClassName(p.letter)}
							loading="lazy"
							style={{ rotate: rotation }}
						/>
					</ImageListItem>
				))}
			</ImageList>
		</>
	)
}

