import deer from '../assets/animal-color/deer-1.png';
import dog from '../assets/animal-color/dog-1.png';
import fox from '../assets/animal-color/fox-1.png';
import koala from '../assets/animal-color/koala-1.png';
import monkey from '../assets/animal-color/monkey-1.png';
import owl from '../assets/animal-color/owl-1.png';
import rabbit from '../assets/animal-color/rabbit-1.png';
import tiger from '../assets/animal-color/tiger-1.png';

//  getAnimalByLetter
export const getAnimalColorImageByLetter = (letter: string) => {

	switch (letter) {
		case 'A':
			return deer;
		case 'B':
			return dog;
		case 'C':
			return fox;
		case 'D':
			return koala;
		case 'E':
			return monkey;
		case 'F':
			return owl;
		case 'G':
			return rabbit;
		default: return tiger;
	}
}

