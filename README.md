# dw-multi-value-field
A Multi-value form-field WebComponent, made by LitElement

## [Demo](https://dreamworldsolutions.github.io/dw-multi-value-field/demo/index.html)

## Install

```sh
npm install @dreamworld/dw-multi-value-field
```

## Usage
By default value is Array of String. And to represent each value(String) in the Array, it renders `dw-input` element. 

For most of the practical use, you would like to render your custom form-element instead of `dw-input`. To do so you need to override the method `_formElementTemplate(itemIndex, itemValue, required)`, which should return the lit-html template for the corresponding form element.

For Example:

```js
import  { DwMultiValueField } from '../dw-multi-value-field.js';

export class DwMultiValueFieldDemo extends DwMultiValueField {
_formElementTemplate(itemIndex, itemValue, required){
	return html `
		<dw-date-input 
			.value="${itemValue}" 
			.index="${itemIndex}"
			?required=${required}"
			label="Date" 
			placeholder="Enter date here">
		</dw-date-input>
	`
}
}
```

## Properties
- `name` (String) Name of the form element.
- `value` (Array) Value of the form element. Used as both (input/output). Set to define initial value, and read to get the latest/updated value.
- `label` (String) Label/Caption for this form element.
- `min` (Number), Minimum number of (children) form elements required.
- `max` (Number), Maximum number of (children) form elements can be used. Once, user reaches this limit, ADD button isn't available to the user.
- `allowDuplicates`, when `true` allows to add duplicate value.