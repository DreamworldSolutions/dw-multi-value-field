# dw-multi-value-field
A Multi-value form-field WebComponent, made by LitElement

## [Demo](https://dreamworldsolutions.github.io/dw-multi-value-field/demo/index.html)

## Install
```html
npm install @dreamworld/dw-multi-value-field
```

## Usage
It's defult provide dw-input template. To override dw-input template override this template '_formElementTemplate'

```
import  { DwMultiValueField } from '../dw-multi-value-field.js';

export class DwMultiValueFieldDemo extends DwMultiValueField {
	_formElementTemplate(itemIndex, itemValue, required){
		return html `
			<dw-date-input 
				.value="${itemValue}" 
				.index="${itemIndex}"
				?required=${required}"
				label="Start date" 
				placeholder="Enter date here">
			</dw-date-input>
		`
	}
}
```

## Properties
- label (String)
- min (Number), Howmany element is required
- max (Number), Maximum howmany element is needs to be display
- value
- allowDuplicates, when `true` allows to add duplicate value
- name