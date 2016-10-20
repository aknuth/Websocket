if (OptimalSelect)
{
	var x = %d;
	var y = %d;

	var element = document.elementFromPoint(x, y);
	var selector = OptimalSelect.select(element); //my_selector_generator.getSelector(element);

	cef_js_track_mouse(x, y, selector);
}