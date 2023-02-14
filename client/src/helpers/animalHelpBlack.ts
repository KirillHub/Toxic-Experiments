import deer from '../assets/animal-black/deer-2.png';
import dog from '../assets/animal-black/dog-2.png';
import fox from '../assets/animal-black/fox-2.png';
import koala from '../assets/animal-black/koala-2.png';
import monkey from '../assets/animal-black/monkey-2.png';
import owl from '../assets/animal-black/owl-2.png';
import rabbit from '../assets/animal-black/rabbit-2.png';
import tiger from '../assets/animal-black/tiger-2.png';

//  getAnimalByLetter
export const getAnimalBlackImageByLetter = (letter: string) => {
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

