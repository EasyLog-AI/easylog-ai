const isHiddenText = (text: string) => {
  return text.startsWith('[') && text.endsWith(']');
};

export default isHiddenText;
