import React from 'react';
import './headerOptions.css';
import enableAudioImg from './img/volume.png';
import disableAudioImg from './img/mute.png';

const HeaderOptions = ({ toggleAudio, audioEnabled, setSearchKeyword }) => {
  const audioImg = audioEnabled ? disableAudioImg : enableAudioImg;
  const handleSearchChange = (event) => {
    setSearchKeyword(event.target.value);
  };

  return (
    <div className="header-options">
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Search messages..."
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      <div className="enable-audio-container">
      <button onClick={toggleAudio} className="enable-audio-button">
          <img src={audioImg} alt={audioEnabled ? 'Disable Audio' : 'Enable Audio'} />
        </button>
      </div>
    </div>
  );
};

export default HeaderOptions;
