#!/usr/bin/env perl

use strict;
use warnings;
use NerdNite::Email;
use Carp;
use Readonly;
use Data::Dumper;
use Underscore;

my $email = NerdNite::Email->new(1);

my $pops     = $email->request('listpops');
my $forwards = $email->request('listforwards');

my $emails = _->union(_->pluck($pops, 'email'), _->pluck($forwards, 'dest'));
$emails = _->sort($emails);

print Dumper($emails);
