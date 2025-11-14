import removeFormattingMarkers from './removeFormattingMarkers';

const isHiddenText = (text: string) => {
  return removeFormattingMarkers(text).length === 0;
};

export default isHiddenText;
