import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import api from '../../services/api';
import Container from '../../components/Container';

import { Loading, Owner, IssuesList, Pagination } from './styles';

export default class Repository extends Component {
  state = {
    repository: {},
    issues: [],
    loading: true,
    filter: 'open',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handlePageChange = async (e) => {
    const { name } = e.target;
    const { filter, repository, page } = this.state;
    const repoName = repository.full_name;
    this.setState({ loading: true });
    await this.setState({ page: name === 'next' ? page + 1 : page - 1 });

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filter,
        page,
      },
    });

    return this.setState({ issues: issues.data, loading: false });
  };

  handleFilterChange = async (e) => {
    const { filter, repository } = this.state;
    const repoName = repository.full_name;
    const { value } = e.target;
    await this.setState({ loading: true, filter: value, page: 1 });

    try {
      const response = await api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filter,
        },
      });
      return this.setState({ loading: false, issues: response.data });
    } catch (error) {
      return console.log(error);
    }
  };

  render() {
    const { loading, repository, issues, filter, page } = this.state;
    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <IssuesList>
          <select value={filter} onChange={this.handleFilterChange}>
            <option value="open">Aberta</option>
            <option value="closed">Fechada</option>
            <option value="all">Todas</option>
          </select>
          {issues.map((issue) => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map((label) => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
          <Pagination>
            <button
              name="prev"
              onClick={(e) => this.handlePageChange(e)}
              type="button"
            >
              <FaArrowLeft size={14} />
            </button>
            <span>{page}</span>
            <button
              name="next"
              onClick={(e) => this.handlePageChange(e)}
              type="button"
            >
              <FaArrowRight size={14} />
            </button>
          </Pagination>
        </IssuesList>
      </Container>
    );
  }
}

Repository.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      repository: PropTypes.string,
    }),
  }).isRequired,
};
