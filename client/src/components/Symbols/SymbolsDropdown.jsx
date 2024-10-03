import Select from 'react-select';

import useSymbols from '../../hooks/useSymbols';

const SymbolsDropdown = ({ onChange , selected}) => {
  const { data: symbols } = useSymbols();

  return (
    <Select
      className="basic-single"
      value={selected}
      classNamePrefix="select"
      onChange={onChange}
      options={symbols}
      name="color"
      isSearchable="true"
    />
  );
};

export default SymbolsDropdown;
