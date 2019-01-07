import $ from 'jquery'

const props = {
    autoFlag: false,
    guideHideFlag: false,
    setColorFlag: false,
    baseColor: '#00ffff',
    focusColor: '#0000ff',
    rulerFlag: false,
    padding: true,
    inline: true,
    filter: false,
    query: '*',
    limitFlag: false,
    limit: 20000
};

$(function () {
    const getValues = () => {
        let valueObject = {};
        $('dl dd input').each(function () {
            const inputElm = $(this);
            const name = inputElm.attr('name');
            const checkBox = inputElm.is('[type="checkbox"]');
            const val = checkBox ? !!(inputElm.is(':checked') && inputElm.val()) : inputElm.val();
            val ? inputElm.parent().next().fadeIn(300) : inputElm.parent().next().fadeOut(300);
            valueObject[name] = val;
        });
        return valueObject
    };

    const setValues = values => {
        Object.keys(values).forEach(key => {
            const elm = $('[name=' + key + ']');
            const checkBox = elm.is('[type="checkbox"]');
            checkBox ? elm.prop('checked', values[key]) : elm.attr('value', values[key]);
            values[key] ? elm.parent().next().fadeIn(300) : elm.parent().next().fadeOut(300);
        })
    }
    setValues(props);

    $('dl dd input').on('change', () => {
        chrome.storage.sync.set(getValues(), () => {})
    });

    chrome.storage.sync.get(getValues(), values => {
        setValues(values);
    });

    $('h1 ul li').on('click', function () {
        const num = $('h1 ul li').index(this);
        $('.main li').hide().eq(num).fadeIn(300);
    })
})