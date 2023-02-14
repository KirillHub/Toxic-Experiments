import deer from '../assets/animal-drink-color/deer-3.png';
import dog from '../assets/animal-drink-color/dog-3.png';
import fox from '../assets/animal-drink-color/fox-3.png';
import koala from '../assets/animal-drink-color/koala-3.png';
import monkey from '../assets/animal-drink-color/monkey-3.png';
import owl from '../assets/animal-drink-color/owl-3.png';
import rabbit from '../assets/animal-drink-color/rabbit-3.png';
import tiger from '../assets/animal-drink-color/tiger-3.png';

//  getAnimalByLetter
export const getAnimalDrinkColorImageByLetter = (letter: string) => {
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

