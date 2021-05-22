/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { css, html } from 'lit-element';
import { LitElement } from '@dreamworld/pwa-helpers/lit-element.js';

// These are the dw element needed by this element.
import '@dreamworld/dw-input/dw-input.js';
import '@dreamworld/dw-button/dw-button.js';
import '@dreamworld/dw-icon-button/dw-icon-button.js';
import { DwFormElement } from '@dreamworld/dw-form/dw-form-element';

// These are the lodash element needed by this element.
import uniqWith from 'lodash-es/uniqWith';
import isEqual from 'lodash-es/isEqual';
import isEmpty from 'lodash-es/isEmpty';
import isArray from 'lodash-es/isArray.js';
import forIn from 'lodash-es/forIn.js'; 

// These are the dw styles element needed by this element.
import * as flexLayoutLiterals from '@dreamworld/flex-layout/flex-layout-literals';
import { Typography } from '@dreamworld/material-styles/typography.js';

export class DwMultiValueField extends DwFormElement(LitElement) {
  static get styles() {
    return [
      Typography,
      css`
        :host {
          display: block;
          --dw-icon-color: rgba(0, 0, 0, 0.6);
        }
        dw-icon-button {
          margin-left: 16px;
        }
        .input-container {
          ${flexLayoutLiterals.displayFlex};
          ${flexLayoutLiterals.horizontal};
        }
        .input-container,
        .label {
          margin-bottom: 16px;
        }
        .error-message {
          color: var(--mdc-theme-error, #b00020);
          margin-bottom: 16px;
        }
        .no-record-message {
          margin: 8px 0px;
          text-align: center;
        }
      `
    ];
  }

  static get properties() {
    return {
      /**
       * label of element
       */
      label: { type: String },

      /**
       * name of element
       */
      name: { type: String },

      /**
       * consider minimum element is required
       */
      min: { type: Number },

      /**
       * consider maximum element is required
       */
      max: { type: Number },

      /**
       * value of this element
       */
      value: { type: Array },

      /**
       * contains errorMessage
       */
      errorMessage: { type: String, reflect: true },

      /**
       * `true` if allow to enter duplicate value. 
       * This property is used during `validate` logic, to check whether any element is duplicate or not.
       */
      allowDuplicates: { type: Boolean },

      /**
       * A Text message which is dispalyed to the user when duplicate value is found in the Array.
       */
      duplicateValidationMsg: { type: String },

      /**
       * A Text message which is dispalyed to the user when `min` validation is falied.
       */
      minValidationMsg: { type: String },

      /**
       * `true` if value is invalid.
       */
      invalid: { type: Boolean, reflect: true },

      /**
       * set noRecordMessage.
       */
      noRecordMessage: { type: String },

      /**
       * Default value is 48. 
       */
      closeButtonSize: { type: Number },

      /**
       *  Default value is 'ADD. 
       */
      addButtonLabel: { type: String },

      /**
       * Input property
       * Set this to apply custom validation of input. Receives value to be validated as argument.
       * It must return Boolean.
       */
      customValidator: { type: Function },

      /**
       * A Text message which is dispalyed to the user when `custom` validation is falied.
       */
      customValidationMsg: { type: String },

      /**
       * contains howmany elements is displyed
       */
      _value: { type: Array }
    }
  }

  render() {
    return html`
      ${this.label ? html`<div class="body1 label">${this.label}</div>` : ''}
      ${this._mainContainerTemplate()} 
      ${this._addButtonTemplate()}
    `
  }

  constructor() {
    super();

    this._value = [];
    this.label = '';
    this._min = 0;
    this.errorMessage = '';
    this.allowDuplicates = false;
    this._formElements = [];
    this._onElementValueChange = this._onElementValueChange.bind(this);
    this.duplicateValidationMsg = 'Duplicate value is not allowed';
    this.noRecordMessage = 'No Records Found';
    this.invalid = false;
    this.closeButtonSize = 48;
    this.addButtonLabel = 'ADD';
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('register-dw-form-element', (e) => {
      let el = e.composedPath()[0];

      if (el === this) {
        return;
      }

      el.addEventListener('value-changed', this._onElementValueChange);
      el.addEventListener('unregister-dw-form-element', (e) => {
        let removeEl = e.composedPath()[0];
        let elIndex = this._formElements.indexOf(removeEl); 

        if (elIndex != -1) {
          this._formElements.splice(elIndex, 1);
        }

        el.removeEventListener('value-changed', this._onElementValueChange);
      });

      this._formElements.push(el);
    });

    this.minValidationMsg = `Minimum ${this.min} fields is required`;
  }

  /**
   * Protected method. 
   */
  _mainContainerTemplate(){
    let required = false;

    return html`
      ${this._value && !this._value.length ? html`${this._noRecordViewTempalte()}` : 
        html `
          ${this._getValueAsArray().map((value, index) => html`
              <section class="input-container">
                ${this._formElementTemplate(index, value, required)}
                  ${this._value.length > this.min ?
                    html`<dw-icon-button .buttonSize=${this.closeButtonSize} icon="clear" @click="${this._onRemove}" .index="${index}"></dw-icon-button>` : ''
                }
              </section>
          `)}
        `
      }
      ${this.errorMessage ? html`<div class="error-message body1">${this.errorMessage}</div>` : ''}
    `;
  }

  /**
   * Protected method. 
   * By default it renders `dw-input` as the form-element. You may override this to render any custom-form element.
   * IMPORTANT: You should propertly set `index` property of the `dw-form-element`, as it's being used in other logic.
   * @param {Number} index 
   * @param {String} value 
   * @param {Boolean} required 
   * used to render template.
   */
  _formElementTemplate(itemIndex, itemValue, required) {
    return html`
      <dw-input 
        .value="${itemValue}" 
        .index="${itemIndex}"
        ?required="${required || (itemIndex < this.min) ? true : false}">
      </dw-input>
    `;
  }

  /**
   * @return {Array} 
   */
  _getValueAsArray() {
    if (!this._value) {
      return [];
    }

    if (!isArray(this._value)) {
      console.warn("value isn't an Array");
      return [];
    }

    return this._value;
  }

  /**
   * A protected method.  You may override it as per your need.
   * add button template
   */
  _addButtonTemplate() {
    return html` 
      ${this._value.length >= this.max ? '' : html`<dw-button outlined .label="${this.addButtonLabel}" @click="${this.addNew}"></dw-button>`}
    `
  }

  /**
   * @param {Array} index 
   * set value
   */
  set value(val) {
    if(this._value === val || this._lastUserValue === val) {
      return;
    }
    let oldValue = this._value;
    this._value = val;
    this._lastUserValue = val;
    this._ensureMin();
    
    if (!isArray(oldValue)) {
      throw new Error('value must be array');
    }

    this.requestUpdate('value', oldValue);
  }

  _setValue(val) {
    if(this._value === val) {
      return;
    }

    let oldValue = this._value;
    this._value = val;
    this.requestUpdate('value', oldValue);
  }

  /**
   * get value
   */
  get value() {
    let aValue = [];
    let value = this._value && this._value.length ? [...this._value] : [];

    value.forEach((value) => {
      if (!this._isEmptyVal(value)) {
        aValue.push(value);
      }
    });

    return aValue;
  }

  /**
   * @param {Number} val 
   */
  set min(val) {
    let oldValue = this._min;
    this._min = val;
    this._ensureMin();
    this.requestUpdate('min', oldValue);
  }

  /**
   * get min value
   */
  get min() {
    return this._min;
  }

  /**
   * Ensures that _value.length is >= min. It uses `addNew()` to fill-up the remaining space
   */
  _ensureMin() {
    if (this._value && this._value.length >= this._min) {
      return;
    }

    for (let i = 0; i < this._min; i++) {
      this.addNew();
    }
  }

  /**
   * It's validate any one field has validation is false
   * It's also validate field has a duplicate value or not.
   */
  validate() {
    let bValidate = true;

    forIn(this._formElements, (element) => {
      if (!element.validate || typeof element.validate !== 'function') {
        return;
      }

      if (!element.validate()) {
        bValidate = false;
      }
    });

    //Retrieve array of values, where empty values have been removed.
    let value = this.value;

    //Custom validation
    if(this.customValidator){
      let validate = this.customValidator(value);
      this.invalid = !validate ;

      if(this.invalid){
        this.errorMessage = this.customValidationMsg;
      }

      if(!this.invalid){
        this.errorMessage = '';
      }

      return validate;
    }

    //Min validation
    if (value.length < this.min) {
      this.errorMessage = this.minValidationMsg;
      this.invalid = true;
      return false;
    }

    //duplicate validation
    if (!this.allowDuplicates && this._hasDuplicates(value)) {
      this.errorMessage = this.duplicateValidationMsg;
      this.invalid = true;
      return false;
    }

    //If validation is passsed then clear any errorMessage if was shown from previous validation,
    this.errorMessage = '';
    this.invalid = !bValidate;
    return bValidate;
  }

  /**
   * A protected method.
   * Verifies whether 2 arguments are equal or not.
   * 
   * Default implementation checks based on the deep equality of the value. In most cases, you don't need to override
   * this method.
   * @param {*} a 
   * @param {*} b 
   */
  _isEqual(a, b) {
    return isEqual(a, b);
  }

  /**
   * Identifies whether value Array has any duplicate element or not.
   * Typically this method receives Array where empty value has already been removed. So, duplicate is checked for the
   * actual user inputted value.
   * 
   * @param value Array of values for which duplicate validation is to be performed.
   */
  _hasDuplicates(value) {
    let newVal = uniqWith(value, this._isEqual.bind(this));
    return newVal.length < value.length;
  }

  /**
   * 
   * @param {Object} e 
   * sets '_value' property
   */
  _onElementValueChange(e) {
    let el = e.currentTarget;
    let formElValue = el.value;
    let formElIndex = el.index;

    if (formElValue === this._value[formElIndex]) {
      console.debug("Value is already same, so skip updating our Array");
      return;
    }

    let newValue = [...this._value];
    newValue.splice(formElIndex, 1, formElValue);
    this._setValue(newValue);
    
    /* Perform validation if current state is invalid */
    if (this.invalid) { 
      this.validate();
    }
  }

  /**
   * 
   * @param {Object} e
   * remove value from specific index 
   */
  _onRemove(e) {
    let index = e.currentTarget.index;

    let value = [...this._value];
    value.splice(index, 1);
    this._setValue(value);
    
    /* Perform validation if current state is invalid */
    if (this.invalid) { 
      this.validate();
    }
  }

  /**
   * call _getNewVal function
   */
  addNew() {
    this._setValue([...this._value, this._getNewVal()]);
  }

  /**
   * A Protected method.
   * 
   * Checks whether the given value is empty or not. By default it checks based on javascript falsy value check.
   * You may need to override this in case your value is not primitive.
   * @param {*} val 
   */
  _isEmptyVal(val) {
    return isEmpty(val);
  }

  /**
   * A protected method.  You may override it as per your need.
   * Returns a value to be used for the newly added form-element.
   * It could return any complex data-type like Object (or even Array), condition is only that the your form-element 
   * (rendered through `_formElementTemplate`) should support that value in the `value` property.
   * 
   * By default it return `null`. 
   */
  _getNewVal() {
    return null;
  }

  /**
   * A protected method.  You may override it as per your need.
   * Returns html template of `No records found` when records is not available.
   */
  _noRecordViewTempalte() {
    return html`<div class="body1 no-record-message">${this.noRecordMessage}</div>`
  }
}

window.customElements.define('dw-multi-value-field', DwMultiValueField);
