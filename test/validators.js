(function () {
  var validators = Odin.validators, ValidationError = Odin.ValidationError;

  function validatorRaises(validator, value, code) {
    try {
      validator(value);
    } catch (e) {
      if (e instanceof ValidationError) {
        equal(e.code, code, "Invalid code");
      } else {
        QUnit.push(false, e, 'ValidationError', 'Raised exception not ValidationError');
      }
      return;
    }
    QUnit.push(false, null, null, 'ValidationError not raised');
  }

  test('minValueValidator', function (){
    var v = validators.minValueValidator(10);

    validatorRaises(v, 9, 'min_value');
    v(10);
    v(11);
  });

  test('maxValueValidator', function (){
    var v = validators.maxValueValidator(10);

    v(9);
    v(10);
    validatorRaises(v, 11, 'max_value');
  });

  test('minLengthValidator', function (){
    var v = validators.minLengthValidator(10);

    validatorRaises(v, '01234567', 'min_length');
    v('0123456789');
    v('0123456789a');
  });

  test('maxLengthValidator', function (){
    var v = validators.maxLengthValidator(10);

    v('01234567');
    v('0123456789');
    validatorRaises(v, '0123456789a', 'max_length');
  });
}());
