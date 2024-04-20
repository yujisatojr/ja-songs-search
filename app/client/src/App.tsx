import { useEffect, useState } from 'react';
import axios from 'axios';
import FadeIn from 'react-fade-in';
import { Oval, ThreeDots } from 'react-loader-spinner'
import { TypeAnimation } from 'react-type-animation';
import './App.scss';

// Import MUI components
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';

// Import icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import HelpIcon from '@mui/icons-material/Help';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import SearchIcon from '@mui/icons-material/Search';

function App() {
  const [searchInput, setSearchInput] = useState<string>('');
  const [filterData, setFilterData] = useState<any>(null);
  const [songData, setSongData] = useState<any>(null);

  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [initRequest, setInitRequest] = useState<boolean>(false);

  const truncateString = (str: string, maxLength: number) => str.length > maxLength ? str.slice(0, maxLength) : str;

  const handleSearchSubmit = async () => {
    setIsFilterLoading(true);
    try {
      const response = await fetch(`/get_filters?user_query=${searchInput}`);
      if (response.ok) {
        const data = await response.json();
        setFilterData(await data);
        setIsFilterLoading(false);
      } else {
        console.error('Error fetching song data');
        setIsFilterLoading(false);
      }
    } catch (error) {
      console.error('Error fetching song data:', error);
      setIsFilterLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post('/search_songs', filterData);
        setSongData(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (filterData !== null) {
      fetchData();
    }

    return () => {
      // Cancel any ongoing requests here if needed
    };
  }, [filterData]);

  useEffect(() => {
    handleSearchSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log(filterData);
  // console.log(songData);

  return (
    <FadeIn transitionDuration={700} className='song_app_root'>
      <div className='header'>
        <h1>AI 歌詞検索 🎶</h1>
        <Button className='button-desktop' variant="contained" endIcon={<HelpIcon />} onClick={() => {
              setOpen(true);
            }}>
          ヘルプ
        </Button>
        <HelpCenterIcon className='button_mobile' onClick={() => {setOpen(true);}}/>
      </div>
      <Collapse in={open}>
        <Alert
        className='alert_container'
        severity="info"
        icon={<HelpIcon fontSize="inherit" />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => {
              setOpen(false);
            }}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{ mb: 2 }}
        >
          <span>この歌詞検索エンジンは生成AIを活用することによって、キーワード検索を超えた「嬉しくて懐かしい」や「悲しい失恋」、「海に関連する」といった自然言語による検索を行うことができます。このアプリは文脈に基づいたセマンティック検索のアルゴリズムを使って、関連する検索結果に優先順位をつけ、おすすめの曲を教えてくれます。</span>
        </Alert>
      </Collapse>

      <div className='search_form_wrapper'>
        <Paper
          className='search_form'
          component="form"
          sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%' }}
          onSubmit={(e) => {
            e.preventDefault();
            setInitRequest(true);
            handleSearchSubmit();
          }}
        >
          <InputBase
            sx={{ ml: 1, flex: 1 }}
            placeholder='文章を入力して検索する'
            inputProps={{ 'aria-label': 'search songs' }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Paper>
      </div>

      {((isFilterLoading || (songData != null && songData.length > 0)) && initRequest !== false) && (
      <Accordion className='accordion_container'>
        <AccordionSummary
          expandIcon={<ArrowDropDownIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
        >
        {isFilterLoading ? (
          <span className='accordion_label'>
            <Oval
              visible={true}
              height="20"
              width="20"
              color="black"
              secondaryColor="gray"
              ariaLabel="oval-loading"
              wrapperStyle={{}}
              wrapperClass=""
              strokeWidth={5}
            />
            あなたの入力分に基づいたオススメ楽曲を作成しています...
          </span>
        ) : (
          <span className='accordion_label'>
            <CheckCircleIcon/> 
            オススメ楽曲の作成が完了しました！（クリックして表示）
          </span>
        )}
        </AccordionSummary>
        <AccordionDetails>
          {(!isFilterLoading && filterData) ? (
          <Alert
          className='alert_container filter_list'
          severity="info"
          sx={{ mb: 2 }}
          >
            <TypeAnimation
              sequence={[
                `${filterData['sentiment'] === 'positive' ? '検索結果には、あなたの入力文に従ってポジティブな感情に合わせた曲のみを選びました。\n' : ''}
                ${filterData['sentiment'] === 'negative' ? '検索結果には、あなたの入力文に従ってネガティブな感情に合わせた曲のみを選びました。\n': ''}
                ${filterData['insights'] !== '' && filterData['insights']}`,
              ]}
              speed={{ type: 'keyStrokeDelayInMs', value: 30 }}
              style={{ fontSize: '1em', display: 'block'}}
              cursor={false}
            />
          </Alert>
          ) : (<span>ロード中...</span>)}
        </AccordionDetails>
      </Accordion>
      )}

      {isFilterLoading && (
      <FadeIn transitionDuration={500}>
        <div className='loading'>
          <ThreeDots
          visible={true}
          height="60"
          width="60"
          color="black"
          radius="9"
          ariaLabel="three-dots-loading"
          wrapperStyle={{}}
          wrapperClass=""
          />
        </div>
      </FadeIn>
      )}

      {!isFilterLoading && (
      <FadeIn transitionDuration={700}>
        <Grid container spacing={2} className='result_container'>
          <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
            <Grid container spacing={2}>
              {songData && songData.map((song: any, index: number) => (
                <Grid item xs={12} sm={12} md={4} lg={4} xl={4} key={index}>
                  <FadeIn transitionDuration={700} key={index}>
                    <div key={index} className='song_img zoom'>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={5} lg={5} xl={5}>
                          <img
                            className='square_img'
                            src={song.img_src}
                            alt={song.song}
                            onError={({ currentTarget }) => {
                              currentTarget.onerror = null; // prevents looping
                            }}
                          />
                        </Grid>
                        <Grid item className='card_info' xs={12} sm={12} md={7} lg={7} xl={7}>
                          <h2>{truncateString(song.song, 15)}</h2>
                          <p>{truncateString(song.artist, 15)}</p>
                        </Grid>
                      </Grid>
                    </div>
                  </FadeIn>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </FadeIn>
      )}

    </FadeIn>
  );
}

export default App;